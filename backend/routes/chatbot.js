const express = require('express');
const { Router } = require('express');
const { respuestaDFChatbot } = require('../controllers/chatbot');

const router = Router();

router.post('/', respuestaDFChatbot);

module.exports = router;