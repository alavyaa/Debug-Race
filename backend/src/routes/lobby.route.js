const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authenticateUser.middleware")
const lobbyController = require("../controllers/lobby.controller");
/**
 * -  post api/lobby/
 * - will create lobby
 */

router.post("/",authenticateUser,lobbyController.createLobbyController);
/**
 * - post api/lobby/join
 * - will give access to join lobby
 */
router.post("/join",authenticateUser,lobbyController.joinLobbyController);
/**
 * - post api/lobby/:code/leave
 * - exit lobby
 */
router.post("/:code/leave",authenticateUser,lobbyController.exitLobbyController);
/**
 * -get api/lobby/:code
 * - getPlayers
 */
router.get("/:code", authenticateUser,lobbyController.getPlayers);
/**
 * - PATCH api/lobby/:code/ready
 * - To get player ready
 */
router.patch("/:code/ready",authenticateUser,lobbyController.toggleReadyController);
/**
 * - POST api/lobby/:code/start
 * - To start the game
 */
router.post("/:code/start", authenticateUser, lobbyController.startRaceController);
/**
 * - PATCH api/lobby/:code/settings
 * - Update race settings (leader only)
 */
router.patch("/:code/settings", authenticateUser, lobbyController.updateSettingsController);
module.exports = router;