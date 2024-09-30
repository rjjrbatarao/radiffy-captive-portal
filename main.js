/** sources
 *
 * https://nodejs.org/download/docs/v4.3.1/api/tls.html
 * https://docs.radiusaas.com/how-to-use/access-point-setup/radsec-available
 * Notes:
 * radsec overrides port for auth, coa and accounting as
 * well as the shared secret defaults to 2083 and `radsec` respectively,
 * while coa uses secret on the mikrotik radius setting
 * encryption:
 * https://www.tabnine.com/code/javascript/functions/tweetnacl/secretbox
 * radius schema:
 * https://github.com/mangospot-net/MangoSpot/blob/master/SQL/1-schema-mysql.sql
 *
 * pkg: issue
 * https://github.com/vercel/pkg/issues/245
 */
/**
 * !global user config
 */
require("dotenv").config();
/**
 * !clustering native nodejs
 */
const cluster = require("node:cluster");
const process = require("node:process");
const os = require("node:os");
const si = require("systeminformation"); // os should suffice use this on GUI app
/**
 * !https
 */
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
/**
 * !internal pub sub
 */
const events = require("events");
const EventEmitter = require("node:events");
const express = require("express");
/**
 * !web servers
 */
const admin = express();
const portal = express();
const cors = require("cors");
const uuid = require("uuid");
/**
 * !Logger
 */
const winston = require("winston");
const { combine, timestamp, json, errors } = winston.format;


/**
 * !hardware encryption
 */
const { machineId, machineIdSync } = require("node-machine-id");
//#######################################################################################

let subscribers = [];

const admin_port = process.env.ADMIN_PORT || 5555;
const admin_secure_port = process.env.ADMIN_PORT_SECURE || 5555;
const portal_port = process.env.PORTAL_PORT || 6666;
const portal_secure_port = process.env.PORTAL_PORT_SECURE || 6666;
const event_emitter = new EventEmitter();

const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "raddify.log",
    }),
    //new LogtailTransport(logtail), // onlien logging
  ],
});

const app_init = async () => {
  await setup
    .start_initialize()
    .then((val) => logger.warn(val))
    .catch((err) => logger.info(err));
};
app_init();
if (cluster.isMaster) {
  logger.info(`Master process ${process.pid} is running`);

  for (let i = 0; i < process.env.CPU_COUNT; i++) {
    cluster.fork();
  }

  cluster.on("exit", (Raddify, code, signal) => {
    if (code != 0) {
      logger.error(
        new Error(
          `Raddify process ${Raddify.process.pid} ${code} ${signal} died. Restarting...`
        )
      );
      cluster.fork();
    } else {
      logger.warn(`Raddify process stopping all`);
      for (var id in cluster.Raddifys) {
        cluster.Raddifys[id].kill();
      }
      process.exit(0);
    }
  });
} else {

}

