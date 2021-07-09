export const local = {
  app: {
    name: "React App",
    origin: "http://localhost:3000",
    env: "local" as "local" | "test" | "prod",
  },
  api: {
    origin: "https://api.hoondev.com",
    prefix: "/reactstarter", // Cloud Function URL pathname
    path: "/api",
  },
  firebase: {
    authKey: "xxxxx",
    authDomain: "https://example.firebaseapp.com",
    projectId: "example",
  },
};

export const test: typeof local = {
  app: {
    ...local.app,
    origin: "https://test.example.com",
    env: "test",
  },
  api: {
    ...local.api,
    origin: "https://api.hoondev.com",
  },
  firebase: {
    authKey: "xxxxx",
    authDomain: "https://example-test.firebaseapp.com",
    projectId: "example-test",
  },
};

export const prod: typeof local = {
  app: {
    ...local.app,
    origin: "https://example.com",
    env: "prod",
  },
  api: {
    ...local.api,
    origin: "https://api.hoondev.com",
  },
  firebase: {
    authKey: "xxxxx",
    authDomain: "https://example.firebaseapp.com",
    projectId: "example",
  },
};

export type Config = typeof local;
export default { local, test, prod };
