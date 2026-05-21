-- BetterAuth core tables for D1 (SQLite)
CREATE TABLE IF NOT EXISTS `user` (
  `id`            TEXT NOT NULL PRIMARY KEY,
  `name`          TEXT NOT NULL,
  `email`         TEXT NOT NULL UNIQUE,
  `emailVerified` INTEGER NOT NULL DEFAULT 0,
  `image`         TEXT,
  `createdAt`     INTEGER NOT NULL,
  `updatedAt`     INTEGER NOT NULL,
  `clientSlug`    TEXT,
  `isAdmin`       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `session` (
  `id`         TEXT NOT NULL PRIMARY KEY,
  `expiresAt`  INTEGER NOT NULL,
  `token`      TEXT NOT NULL UNIQUE,
  `createdAt`  INTEGER NOT NULL,
  `updatedAt`  INTEGER NOT NULL,
  `ipAddress`  TEXT,
  `userAgent`  TEXT,
  `userId`     TEXT NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `account` (
  `id`                     TEXT NOT NULL PRIMARY KEY,
  `accountId`              TEXT NOT NULL,
  `providerId`             TEXT NOT NULL,
  `userId`                 TEXT NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  `accessToken`            TEXT,
  `refreshToken`           TEXT,
  `idToken`                TEXT,
  `accessTokenExpiresAt`   INTEGER,
  `refreshTokenExpiresAt`  INTEGER,
  `scope`                  TEXT,
  `password`               TEXT,
  `createdAt`              INTEGER NOT NULL,
  `updatedAt`              INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS `verification` (
  `id`         TEXT NOT NULL PRIMARY KEY,
  `identifier` TEXT NOT NULL,
  `value`      TEXT NOT NULL,
  `expiresAt`  INTEGER NOT NULL,
  `createdAt`  INTEGER,
  `updatedAt`  INTEGER
);

-- Invite links for client onboarding
CREATE TABLE IF NOT EXISTS `invitations` (
  `id`          TEXT NOT NULL PRIMARY KEY,
  `token`       TEXT NOT NULL UNIQUE,
  `clientSlug`  TEXT NOT NULL,
  `createdBy`   TEXT NOT NULL,
  `email`       TEXT,
  `expiresAt`   INTEGER NOT NULL,
  `usedAt`      INTEGER,
  `usedBy`      TEXT
);
