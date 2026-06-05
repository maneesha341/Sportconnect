const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Trainer = require('../models/Trainer');

// Smart scoring algorithm — no AI API needed, completely free
function scoreTrainer(trainer, requirements) {
  let score = 0;
  const reasons = [];
  const concerns = [];

  const { sport, budget, experience, location, sessionType, studentsLevel, frequency, priority } = requirements;

  // 1. Sport match (35 points) — most important
  const trainerSports = (trainer.sports || []).map(s => s.toLowerCase());
  const wantedSport = (sport || '').toLowerCase();
  if (trainerSports.includes(wantedSport)) {
    score += 35;
    reasons.push(`Coaches ${sport} — exact sport match`);
  } else if (trainerSports.some(s => s.includes(wantedSport) || wantedSport.includes(s))) {
    score += 15;
    reasons.push(`Related sport experience`);
    concerns.push(`Primary sport may not be ${sport}`);
  } else {
    concerns.push(`Does not specialize in ${sport}`);
  }

  // 2. Budget match (25 points)
  const budgetNum = Number(budget) || 99999;
  const rate = trainer.hourlyRate || 0;
  if (rate === 0) {
    score += 10;
    concerns.push('Hourly rate not set yet');
  } else if (rate <= budgetNum) {
    const savings = budgetNum - rate;
    if (savings >= budgetNum * 0.5) {
      score += 25;
      reasons.push(`Great value at RS.${rate}/hr — well within budget`);
    } else {
      score += 18;
      reasons.push(`Within budget at RS.${rate}/hr`);
    }
  } else {
    score += 0;
    concerns.push(`Rate RS.${rate}/hr exceeds your budget of RS.${budgetNum}/hr`);
  }

  // 3. Experience match (20 points)
  const wantedExp = Number(experience) || 0;
  const trainerExp = trainer.experience || 0;
  if (trainerExp >= wantedExp) {
    if (trainerExp >= wantedExp + 5) {
      score += 20;
      reasons.push(`Highly experienced — ${trainerExp} years`);
    } else {
      score += 15;
      reasons.push(`${trainerExp} years of experience meets requirement`);
    }
  } else if (trainerExp >= wantedExp - 1) {
    score += 8;
    concerns.push(`Slightly less experience (${trainerExp} yrs) than preferred (${wantedExp} yrs)`);
  } else {
    score += 3;
    concerns.push(`Only ${trainerExp} years experience, you wanted ${wantedExp}+`);
  }

  // 4. Location match (10 points)
  if (location && trainer.location) {
    const loc1 = location.toLowerCase();
    const loc2 = (trainer.location || '').toLowerCase();
    const state = (trainer.trainerState || '').toLowerCase();
    if (loc2.includes(loc1) || loc1.includes(loc2)) {
      score += 10;
      reasons.push(`Located in ${trainer.location} — matches your preference`);
    } else if (state.includes(loc1) || loc1.includes(state)) {
      score += 5;
      reasons.push(`Same state as your preference`);
    } else {
      concerns.push(`Based in ${trainer.location}, not near ${location}`);
    }
  } else {
    score += 5; // no location preference = neutral
  }

  // 5. Rating bonus (5 points)
  const rating = trainer.rating || 0;
  if (rating >= 4.5) { score += 5; reasons.push(`Excellent rating: ${rating}/5`); }
  else if (rating >= 4)  { score += 3; reasons.push(`Good rating: ${rating}/5`); }
  else if (rating === 0) { reasons.push('No ratings yet — new trainer'); }

  // 6. Certifications bonus (5 points)
  if (trainer.certifications?.length > 0) {
    score += 5;
    reasons.push(`Certified: ${trainer.certifications.slice(0,2).join(', ')}`);
  }

  // 7. Priority boost
  if (priority === 'Highest rated trainer' && rating >= 4) score += 8;
  if (priority === 'Most experienced' && trainerExp >= 5)  score += 8;
  if (priority === 'Best value for money' && rate <= budgetNum * 0.6) score += 8;
  if (priority === 'Certified trainer' && trainer.certifications?.length > 0) score += 8;

  // 8. Student level fit
  if (studentsLevel === 'Complete beginners' && trainerExp >= 1) {
    reasons.push('Good for training beginners');
  } else if (studentsLevel === 'Advanced / competitive' && trainerExp >= 5) {
    score += 5;
    reasons.push('Experience level suitable for advanced students');
  }

  // 9. Availability
  if (trainer.availability === 'busy') {
    score -= 10;
    concerns.push('Trainer is currently marked as busy');
  }

  // Cap at 100
  score = Math.min(100, Math.max(0, score));

  return { score, reasons, concerns };
}

// POST /api/ai/recommend
router.post('/recommend', auth, async (req, res) => {
  try {
    const requirements = req.body;
    const { sport, budget, priority } = requirements;

    // Fetch all trainers
    const trainers = await Trainer.find({});

    if (trainers.length === 0) {
      return res.json({
        summary: 'No trainers are registered yet. Ask trainers to sign up and complete their profiles.',
        recommendations: [],
      });
    }

    // Score every trainer
    const scored = trainers.map(trainer => {
      const { score, reasons, concerns } = scoreTrainer(trainer, requirements);
      return { trainer, score, reasons, concerns };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Take top 3
    const top3 = scored.slice(0, 3);

    // Build response
    const recommendations = top3.map(({ trainer, score, reasons, concerns }) => ({
      trainerId:         trainer._id.toString(),
      name:              trainer.name,
      matchScore:        score,
      whyGoodFit:        reasons.slice(0, 3).join('. ') + '.',
      concerns:          concerns.length > 0 ? concerns.join('. ') : 'None',
      highlights:        reasons.slice(0, 3),
      trainerPhoto:      trainer.photo || '',
      trainerSports:     trainer.sports || [],
      trainerExperience: trainer.experience || 0,
      trainerRate:       trainer.hourlyRate || 0,
    }));

    // Generate summary
    const best = top3[0];
    let summary = '';
    if (best && best.score >= 70) {
      summary = `We found strong matches for ${sport} training. ${best.trainer.name} is the top recommendation with a ${best.score}% match score based on sport, budget, experience and location. `;
      if (top3.length > 1) summary += `${top3[1].trainer.name} is also a solid choice${budget ? ` within your RS.${budget}/hr budget` : ''}.`;
    } else if (best && best.score >= 40) {
      summary = `We found partial matches for your requirements. ${best.trainer.name} scores highest at ${best.score}% but may not meet all criteria. Consider adjusting your budget or experience requirements for better results.`;
    } else {
      summary = `No strong matches found for ${sport} training with your current requirements. The trainers below are the closest available. Consider expanding your budget or location preference.`;
    }

    res.json({ summary, recommendations });

  } catch (err) {
    console.error('Recommend error:', err.message);
    res.status(500).json({ message: err.message || 'Recommendation failed.' });
  }
});

module.exports = router;