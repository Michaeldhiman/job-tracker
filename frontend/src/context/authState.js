let logoutHandler = null;

export const setLogoutHandler = (handler) => {
  logoutHandler = typeof handler === 'function' ? handler : null;
};

export const getLogoutHandler = () => logoutHandler;

