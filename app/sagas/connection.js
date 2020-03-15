import * as jsxapi from 'jsxapi';
// import normalizePath from 'jsxapi/lib/xapi/normalizePath.js';
import { eventChannel } from 'redux-saga';
import { takeEvery, all, call, cancel, fork, put, race, take, select } from 'redux-saga/effects';

import {
  connectFailure,
  connectSuccess,
  CONNECT_REQUEST,
  disconnectSuccess,
  DISCONNECT_REQUEST,
  DISCONNECT_SUCCESS,
} from '../actions/connection';
import {
  COMMAND_REQUEST,
  CONFIG_GET_REQUEST,
  CONFIG_SET_REQUEST,
  STATUS_GET_REQUEST,
  STATUS_SET_REQUEST,
} from '../actions/xapi';
import { commandSaga, configGetSaga, configSetSaga, statusGetSaga, statusSetSaga } from './xapi';
import {
  SETUP_FEEDBACK_REQUEST,
  setupFeedbackFailure,
  setupFeedbackSuccess,
  TEARDOWN_FEEDBACK_REQUEST,
  teardownFeedbackFailure,
  teardownFeedbackSuccess,
} from '../actions/feedback';
import { updateStatus } from '../actions/statuses';
import { connectionStatusSelector } from '../selectors/connections';
import ConnectionStatus from '../constants/connection-status';
import { feedbackSelector } from '../selectors/feedbacks';
import { FeedbackStatus } from '../constants';

export function createFeedbackChannel(xapi, host, password, path) {
  return eventChannel((emit) => {
    let off = () => {};
    const [type, ...remainingPath] = path.split('/');

    const api = type === 'Configuration' ? xapi.config : xapi.status;
    api
      .get(remainingPath)
      .then((data) => {
        emit('ready');
        emit(data);
        off = xapi.feedback.on(path, (data) => {
          emit(data);
        });
      })
      .catch((error) => {
        emit(error);
      });

    const unsubscribe = () => {
      off();
    };

    return unsubscribe;
  });
}

export function createXapiChannel(xapi) {
  return eventChannel((emit) => {
    xapi
      .on('error', emit)
      .on('ready', () => emit('open'))
      .on('close', () => emit('close'));

    const unsubscribe = () => {
      xapi.close();
    };

    return unsubscribe;
  });
}

export function* receiveMessagesWatcher(xapiChannel, host) {
  while (true) {
    const message = yield take(xapiChannel);
    if (message === 'close') {
      yield put(disconnectSuccess(host));
    } else if (message === 'open') {
      yield put(connectSuccess(host));
    } else {
      yield put(disconnectSuccess(host));
      console.error(message);
    }
  }
}

function* feedbackWatcher(xapi, host, password, { path }) {
  const attached = yield select(feedbackSelector(host, path));
  if (attached !== FeedbackStatus.CONNECTING) {
    return;
  }

  let updateStatusWatcher;
  let channel;
  try {
    channel = yield call(createFeedbackChannel, xapi, host, password, path);
    const feedbackReadyStatus = yield take(channel);
    if (feedbackReadyStatus === 'ready') {
      yield put(setupFeedbackSuccess(host, path));
      updateStatusWatcher = yield takeEvery(channel, function* a(data) {
        if (data instanceof Error) {
          throw data;
        }
        yield put(updateStatus(host, path, data));
      });
    } else {
      throw new Error(JSON.stringify(feedbackReadyStatus));
    }
  } catch (error) {
    yield put(setupFeedbackFailure(host, path, error));
  }

  if (updateStatusWatcher && channel) {
    while (true) {
      try {
        yield take((action) => action.type === TEARDOWN_FEEDBACK_REQUEST && action.host === host);
        yield cancel(updateStatusWatcher);
        channel.close();
        yield put(teardownFeedbackSuccess(host, path));
        break;
      } catch (error) {
        yield put(teardownFeedbackFailure(host, path, error));
      }
    }
  }
}

export function* xapiWatcher(xapi, host, password) {
  const takeEveryHost = (pattern, saga) =>
    fork(function* a() {
      while (true) {
        const action = yield take(pattern);
        const { host: requestedHost } = action;
        if (requestedHost === host) {
          yield fork(saga, xapi, action);
        }
      }
    });

  yield takeEveryHost(COMMAND_REQUEST, commandSaga);
  yield takeEveryHost(STATUS_GET_REQUEST, statusGetSaga);
  yield takeEveryHost(STATUS_SET_REQUEST, statusSetSaga);
  yield takeEveryHost(CONFIG_GET_REQUEST, configGetSaga);
  yield takeEveryHost(CONFIG_SET_REQUEST, configSetSaga);

  yield takeEvery(
    (action) => action.type === SETUP_FEEDBACK_REQUEST && action.host === host,
    feedbackWatcher,
    xapi,
    host,
    password,
  );
}

function* messagesWatcher({ host, password }) {
  const status = yield select(connectionStatusSelector(host));
  if (status !== ConnectionStatus.CONNECTING) {
    return;
  }

  try {
    const xapi = jsxapi.connect(`wss://${host}`, {
      username: 'admin',
      password,
    });
    const xapiChannel = yield call(createXapiChannel, xapi);

    const scripts = yield fork(xapiWatcher, xapi, host, password);

    const { disconnected } = yield race({
      listeners: all([call(receiveMessagesWatcher, xapiChannel, host)]),
      close: call(function* a() {
        let disconnectHost;
        do {
          ({ host: disconnectHost } = yield take(DISCONNECT_REQUEST));
        } while (disconnectHost !== host);
      }),
      disconnected: call(function* a() {
        let disconnectHost;
        do {
          ({ host: disconnectHost } = yield take(DISCONNECT_SUCCESS));
        } while (disconnectHost !== host);
      }),
    });

    yield cancel(scripts);
    yield xapi.close();

    yield xapiChannel.close();
    if (!disconnected) {
      yield put(disconnectSuccess(host));
    }
  } catch (e) {
    console.error(e.message);
    yield put(connectFailure(host, e));
  }
}

export default function*() {
  yield takeEvery(CONNECT_REQUEST, messagesWatcher);
}
