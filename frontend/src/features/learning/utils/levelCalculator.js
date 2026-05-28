// Letter groups definitions (copied from LevelMap to avoid circular dependency)
export const LETTER_GROUPS_EN = {
  group_1: { letters: ['S','A','T','I','P','N'], label: 'Group 1', color: '#66bb6a', bg: '#e8f5e9' },
  group_2: { letters: ['C','K','E','H','R','M','D'], label: 'Group 2', color: '#42a5f5', bg: '#e3f2fd' },
  group_3: { letters: ['G','O','U','L','F','B'], label: 'Group 3', color: '#ffa726', bg: '#fff3e0' },
  group_4: { letters: ['J','V','W','X'], label: 'Group 4', color: '#ab47bc', bg: '#f3e5f5' },
  group_5: { letters: ['Y','Z','Q'], label: 'Group 5', color: '#ef5350', bg: '#ffebee' },
};

export const LETTER_GROUPS_AR = {
  group_1: { letters: ['ا','ب','ت','ث'], label: 'المجموعة ١', color: '#66bb6a', bg: '#e8f5e9' },
  group_2: { letters: ['ن','ي','م','ل'], label: 'المجموعة ٢', color: '#42a5f5', bg: '#e3f2fd' },
  group_3: { letters: ['س','ش'], label: 'المجموعة ٣', color: '#ffa726', bg: '#fff3e0' },
};

/**
 * Calculate overall mastery level based on boss level completion and AI-assigned level
 * @param {Array} activities - All activities for the child
 * @param {Object} activityProgress - Progress data for each activity
 * @param {string} lang - Language code ('en' or 'ar')
 * @param {number|string} aiAssignedLevel - AI-assessed literacy level from database (optional)
 * @returns {number} Mastery level (1-5)
 */
export function calculateOverallMasteryLevel(activities, activityProgress, lang = 'en', aiAssignedLevel = null) {
  const groups = lang === 'ar' ? LETTER_GROUPS_AR : LETTER_GROUPS_EN;
  let completedBossLevels = 0;

  // Check each group for boss level completion
  Object.entries(groups).forEach(([groupKey, groupData]) => {
    // Find boss activities for this group (sound_blender, word_builder, read_match)
    const bossActivities = activities.filter(a =>
      (a.activity_group === groupKey || a.activity_group === `${groupKey}_words`) &&
      ['sound_blender', 'word_builder', 'read_match'].includes(a.activity_type)
    );

    // Only count as completed boss level if there are boss activities AND they're all completed
    if (bossActivities.length > 0) {
      const completedCount = bossActivities.filter(a => {
        const p = activityProgress?.[a.Activity_ID];
        return p?.completion_status === 'completed';
      }).length;

      // Boss level is only complete if ALL boss activities in the group are finished
      if (completedCount === bossActivities.length) {
        completedBossLevels++;
      }
    }
  });

  // If AI assigned a level, use it as the base level
  // The child can progress beyond this by completing boss levels
  let baseLevel = 1;
  if (aiAssignedLevel !== null && aiAssignedLevel !== undefined && aiAssignedLevel !== '') {
    baseLevel = parseInt(aiAssignedLevel, 10);
    // Ensure it's within valid range
    if (isNaN(baseLevel) || baseLevel < 1) baseLevel = 1;
    if (baseLevel > 5) baseLevel = 5;
  } else {
    // Fallback: Use completed boss levels + 1
    baseLevel = Math.min(completedBossLevels + 1, 5);
  }

  // Allow progression beyond AI-assigned level through boss level completion
  // But don't show lower than AI-assigned level
  const bossBasedLevel = completedBossLevels + 1;
  return Math.max(baseLevel, bossBasedLevel);
}

/**
 * Get group number for a given level
 * @param {number} masteryLevel - Overall mastery level (1-5)
 * @param {string} lang - Language code
 * @returns {string} Group key for the current level
 */
export function getGroupForLevel(masteryLevel, lang = 'en') {
  const groups = lang === 'ar' ? LETTER_GROUPS_AR : LETTER_GROUPS_EN;
  const groupKeys = Object.keys(groups);

  // Level 1 works on group_1, Level 2 on group_2, etc.
  const groupIndex = Math.min(masteryLevel - 1, groupKeys.length - 1);
  return groupKeys[groupIndex];
}
