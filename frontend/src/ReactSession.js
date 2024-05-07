const ReactSession = {
  SESSION_OBJECT_NAME: "__moggers__",

  get: function(key) {
    const item = localStorage.getItem(this.SESSION_OBJECT_NAME);
    return item ? JSON.parse(item)[key] : null;
  },

  set: function(key, value) {
    const session = JSON.parse(localStorage.getItem(this.SESSION_OBJECT_NAME)) || {};
    session[key] = value;
    localStorage.setItem(this.SESSION_OBJECT_NAME, JSON.stringify(session));
  },

  remove: function(key) {
    const session = JSON.parse(localStorage.getItem(this.SESSION_OBJECT_NAME)) || {};
    delete session[key];
    localStorage.setItem(this.SESSION_OBJECT_NAME, JSON.stringify(session));
  }
};

export default ReactSession;