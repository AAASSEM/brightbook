import api from "./api";

export const learningService = {
  // Get activities for a child
  getChildActivities: (childId, group = null) => {
    const params = new URLSearchParams();
    if (group) params.append("group", group);
    params.append("t", Date.now());
    return api.get(`/api/learning/activities/child/${childId}?${params.toString()}`);
  },

  // Get a specific activity
  getActivity: (activityId) => {
    return api.get(`/api/learning/activities/${activityId}`);
  },

  // Complete an activity
  completeActivity: (activityId, data) => {
    return api.post(`/api/learning/activities/${activityId}/complete-child`, data);
  },

  // Get child learning progress
  getChildProgress: (childId) => {
    return api.get(`/api/learning/progress/${childId}`);
  },

  // Get available letter groups
  getAvailableGroups: () => {
    return api.get('/api/learning/groups/available');
  },

  // Get mastered letters for a child
  getMasteredLetters: (childId) => {
    return api.get(`/api/learning/letters/${childId}/mastered`);
  },

  checkWordActivitiesUnlock: (childId) => {
    return api.post(`/api/learning/letters/${childId}/check-unlock`);
  },

  // Get child achievements
  getAchievements: (childId) => {
    return api.get(`/api/learning/achievements/${childId}`);
  },

  // Analyze a child's pronunciation via Gemini AI
  // formData must contain: audio (File), target_word, target_letter, child_age, language
  analyzePronunciation: (formData) => {
    return api.post('/api/learning/pronunciation/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // 30s — audio + AI takes longer
    });
  },

  // Analyze a child's handwriting via Gemini Vision
  // formData must contain: image (File/Blob), target_letter, child_age, language
  analyzeHandwriting: (formData) => {
    return api.post('/api/learning/handwriting/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // 30s — image + AI takes longer
    });
  },
};

export default learningService;