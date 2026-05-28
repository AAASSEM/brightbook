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
  }
};

export default learningService;