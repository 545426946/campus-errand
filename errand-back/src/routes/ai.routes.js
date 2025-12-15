const express = require('express');
const {
  getCourseRecommendations,
  analyzeLearningProgress,
  chatWithAI,
  generateQuiz
} = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/recommendations', getCourseRecommendations);
router.get('/analysis', analyzeLearningProgress);
router.post('/chat', chatWithAI);
router.post('/generate-quiz', generateQuiz);

module.exports = router;
