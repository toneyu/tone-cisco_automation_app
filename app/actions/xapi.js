export const COMMAND_REQUEST = 'xapi/COMMAND_REQUEST';
export const COMMAND_SUCCESS = 'xapi/COMMAND_SUCCESS';
export const COMMAND_FAILURE = 'xapi/COMMAND_FAILURE';

export const STATUS_GET_REQUEST = 'xapi/STATUS_GET_REQUEST';
export const STATUS_GET_SUCCESS = 'xapi/STATUS_GET_SUCCESS';
export const STATUS_GET_FAILURE = 'xapi/STATUS_GET_FAILURE';

export const STATUS_SET_REQUEST = 'xapi/STATUS_SET_REQUEST';
export const STATUS_SET_SUCCESS = 'xapi/STATUS_SET_SUCCESS';
export const STATUS_SET_FAILURE = 'xapi/STATUS_SET_FAILURE';

export const CONFIG_GET_REQUEST = 'xapi/CONFIG_GET_REQUEST';
export const CONFIG_GET_SUCCESS = 'xapi/CONFIG_GET_SUCCESS';
export const CONFIG_GET_FAILURE = 'xapi/CONFIG_GET_FAILURE';

export const CONFIG_SET_REQUEST = 'xapi/CONFIG_SET_REQUEST';
export const CONFIG_SET_SUCCESS = 'xapi/CONFIG_SET_SUCCESS';
export const CONFIG_SET_FAILURE = 'xapi/CONFIG_SET_FAILURE';

export const commandRequest = (...args) => ({
  type: COMMAND_REQUEST,
  args,
});

export const commandSuccess = () => ({
  type: COMMAND_SUCCESS,
});

export const commandFailure = (error) => ({
  type: COMMAND_FAILURE,
  error,
});

export const statusGetRequest = (...args) => ({
  type: STATUS_GET_REQUEST,
  args,
});

export const statusGetSuccess = (...args) => ({
  type: STATUS_GET_SUCCESS,
  args,
});

export const statusGetFailure = (error) => ({
  type: STATUS_GET_FAILURE,
  error,
});

export const statusSetRequest = (...args) => ({
  type: STATUS_SET_REQUEST,
  args,
});

export const statusSetSuccess = (...args) => ({
  type: STATUS_SET_SUCCESS,
  args,
});

export const statusSetFailure = (error) => ({
  type: STATUS_SET_FAILURE,
  error,
});

export const configSetRequest = (...args) => ({
  type: CONFIG_SET_REQUEST,
  args,
});

export const configSetSuccess = (...args) => ({
  type: CONFIG_SET_SUCCESS,
  args,
});

export const configSetFailure = (error) => ({
  type: CONFIG_SET_FAILURE,
  error,
});

export const configGetRequest = (...args) => ({
  type: CONFIG_GET_REQUEST,
  args,
});

export const configGetSuccess = (...args) => ({
  type: CONFIG_GET_SUCCESS,
  args,
});

export const configGetFailure = (error) => ({
  type: CONFIG_GET_FAILURE,
  error,
});
