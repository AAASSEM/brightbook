import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useLang } from '@/shared/stores/langStore';

// ── Group definitions ──────────────────────────────────────────────────────
const LETTER_GROUPS_EN = {
  group_1: { letters: ['S','A','T','I','P','N'], label: 'Group 1', color: '#66bb6a', bg: '#e8f5e9' },
  group_2: { letters: ['C','K','E','H','R','M','D'], label: 'Group 2', color: '#42a5f5', bg: '#e3f2fd' },
  group_3: { letters: ['G','O','U','L','F','B'], label: 'Group 3', color: '#ffa726', bg: '#fff3e0' },
  group_4: { letters: ['J','V','W','X'], label: 'Group 4', color: '#ab47bc', bg: '#f3e5f5' },
  group_5: { letters: ['Y','Z','Q'], label: 'Group 5', color: '#ef5350', bg: '#ffebee' },
};

const LETTER_GROUPS_AR = {
  arabic_group_1: { letters: ['ا','ب','ت','ث'], label: 'المجموعة ١', color: '#66bb6a', bg: '#e8f5e9' },
  arabic_group_2: { letters: ['ن','ي','م','ل'], label: 'المجموعة ٢', color: '#42a5f5', bg: '#e3f2fd' },
  arabic_group_3: { letters: ['س','ش'], label: 'المجموعة ٣', color: '#ffa726', bg: '#fff3e0' },
};

const MASCOT_EMOJIS = {
  S:'🐍',A:'🐜',T:'🐯',I:'🦎',P:'🐷',N:'🎵',
  C:'🐱',K:'🦘',E:'🐘',H:'🐴',R:'🐰',M:'🐭',D:'🦆',
  G:'🦒',O:'🐙',U:'🦄',L:'🦁',F:'🐟',B:'🐻',
  J:'🪼',V:'🦅',W:'🦭',X:'🦊',
  Y:'🐃',Z:'🦓',Q:'🐦',
  'ا':'🐰','ب':'🦆','ت':'🐊','ث':'🦊','ن':'🐝','ي':'🐦','م':'🦌','ل':'🍋','س':'🐟','ش':'☀️'
};

// Flatten all levels from groups + word levels
export function buildLevelList(activities, activityProgress, lang = 'en') {
  console.log("Building Level List with", activities.length, "activities", "lang:", lang);
  const levels = [];
  let levelNum = 1;
  const groups = lang === 'ar' ? LETTER_GROUPS_AR : LETTER_GROUPS_EN;

  Object.entries(groups).forEach(([groupKey, groupData]) => {
    // One level per letter in the group
    groupData.letters.forEach((letter) => {
      const letterActivities = activities.filter(
        a => {
          const content = parseContent(a.activity_content);
          // Check for exact letter match and group match
          const letterMatch = content?.letter === letter;
          const groupMatch = a.activity_group === groupKey;
          const typeMatch = ['meet_letter','hear_sound','trace_write','mini_quest'].includes(a.activity_type);
          return letterMatch && groupMatch && typeMatch;
        }
      );

      const completedCount = letterActivities.filter(a => {
        const p = activityProgress?.[a.Activity_ID];
        return p?.completion_status === 'completed';
      }).length;

      const maxStars = letterActivities.reduce((sum, a) => {
        const p = activityProgress?.[a.Activity_ID];
        return sum + (p?.stars_earned || 0);
      }, 0);

      const totalPossibleStars = letterActivities.length * 3;
      const status = completedCount === 0 ? 'locked' :
        completedCount === letterActivities.length ? 'completed' : 'in_progress';

      levels.push({
        levelNum,
        letter,
        groupKey,
        groupColor: groupData.color,
        groupBg: groupData.bg,
        emoji: MASCOT_EMOJIS[letter] || '📚',
        activities: letterActivities,
        completedCount,
        totalActivities: letterActivities.length,
        starsEarned: maxStars,
        totalPossibleStars,
        status,
        isBoss: false,
        isWordLevel: false,
      });
      levelNum++;
    });

    // Word level after each group
    const wordActivities = activities.filter(
      a => (a.activity_group === groupKey || a.activity_group === `${groupKey}_words`) &&
        ['sound_blender','word_builder','read_match'].includes(a.activity_type)
    );

    if (wordActivities.length > 0) {
      const completedWord = wordActivities.filter(a => {
        const p = activityProgress?.[a.Activity_ID];
        return p?.completion_status === 'completed';
      }).length;

      const wordStars = wordActivities.reduce((sum, a) => {
        const p = activityProgress?.[a.Activity_ID];
        return sum + (p?.stars_earned || 0);
      }, 0);

      levels.push({
        levelNum,
        letter: '★',
        groupKey,
        groupColor: '#ffd700',
        groupBg: '#fffde7',
        emoji: '🏆',
        activities: wordActivities,
        completedCount: completedWord,
        totalActivities: wordActivities.length,
        starsEarned: wordStars,
        totalPossibleStars: wordActivities.length * 3,
        status: completedWord === 0 ? 'locked' : completedWord === wordActivities.length ? 'completed' : 'in_progress',
        isBoss: true,
        isWordLevel: true,
        label: lang === 'ar' 
          ? (groupKey.startsWith('arabic_') ? `كلمات ${groupData.label}` : `${groupData.label} Words (EN)`) 
          : (groupKey.startsWith('arabic_') ? `${groupData.label} Words (AR)` : `${groupData.label} Words`),
      });
      levelNum++;
    }
  });

  // Unlock logic: handle missing groups intelligently
  // Find first group with activities and unlock it
  let firstGroupWithActivities = true;
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const hasActivities = level.totalActivities > 0;

    if (hasActivities && firstGroupWithActivities) {
      // First group with activities gets unlocked
      level.status = level.status === 'locked' ? 'current' : level.status;
      firstGroupWithActivities = false;
    } else if (hasActivities && !firstGroupWithActivities) {
      // Subsequent groups follow normal completion logic
      const prev = levels[i - 1];
      if (level.status === 'locked' && prev.status === 'completed') {
        level.status = 'current';
      }
    }
    // Groups with no activities stay locked
  }

  return levels;
}

function parseContent(content) {
  if (!content) return {};
  let parsed = content;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return {}; }
  }
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return {}; }
  }
  return parsed;
}

export default function LevelMap({ activities, activityProgress, onSelectActivity }) {
  const t = useT();
  const lang = useLang();
  const [expandedLevel, setExpandedLevel] = useState(null);
  const levels = buildLevelList(activities, activityProgress, lang);
  const visibleLevels = levels.filter(level => level.totalActivities > 0);
  const currentLevel = levels.find(l => l.status === 'current' || l.status === 'in_progress');

  return (
    <div className={`max-w-4xl mx-auto h-full flex flex-col bg-[#fafbf9] select-none ${lang === 'ar' ? 'rtl' : 'ltr'}`} style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Mini header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b z-10" style={{ borderColor: '#eff6e7' }}>
        <div>
          <h2 className="text-lg font-black" style={{ color: '#171d14' }}>{t('nav.learningPath')}</h2>
          <p className="text-xs font-bold" style={{ color: '#6f7a6b' }}>
            {visibleLevels.filter(l => l.status === 'completed').length}/{visibleLevels.length} {t('common.done')}
          </p>
        </div>
        <div className="flex gap-2 text-xs font-bold flex-wrap justify-end">
          <span className="px-2 py-1 rounded-full" style={{ background: '#e8f5e9', color: '#2e7d32' }}>✓ {t('common.done')}</span>
          <span className="px-2 py-1 rounded-full" style={{ background: '#fff9c4', color: '#f57f17' }}>▶ {t('common.active')}</span>
          <span className="px-2 py-1 rounded-full" style={{ background: '#eeeeee', color: '#757575' }}>🔒 {t('common.closed')}</span>
        </div>
      </div>

      {/* Level path */}
      <div className="relative">
        {visibleLevels.map((level, filteredIdx) => {
          const isExpanded = expandedLevel === level.levelNum;
          const isLocked = level.status === 'locked';
          const isCompleted = level.status === 'completed';
          const isCurrent = level.status === 'current' || level.status === 'in_progress';
          
          const isRtl = document.documentElement.dir === 'rtl';
          const isRight = isRtl ? (filteredIdx % 2 !== 0) : (filteredIdx % 2 === 0); // Zigzag flips for RTL
          const groups = lang === 'ar' ? LETTER_GROUPS_AR : LETTER_GROUPS_EN;

          return (
            <div key={level.levelNum} className="mb-3">
              {/* Group header */}
              {!level.isWordLevel && level.letter === groups[level.groupKey]?.letters[0] && (
                <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">
                  <div className="h-px flex-1" style={{ background: level.groupColor + '40' }} />
                  <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: level.groupBg, color: level.groupColor }}>
                    {groups[level.groupKey]?.label}
                  </span>
                  <div className="h-px flex-1" style={{ background: level.groupColor + '40' }} />
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, x: isRight ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: filteredIdx * 0.04 }}
                className={`flex ${isRight ? 'justify-start' : 'justify-end'}`}
              >
                <div style={{ width: '96%' }}>
                  {/* Level card */}
                  <motion.div
                    whileHover={!isLocked ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                    onClick={() => !isLocked && setExpandedLevel(isExpanded ? null : level.levelNum)}
                    className="rounded-3xl overflow-hidden cursor-pointer"
                    style={{
                      background: isLocked ? '#f5f5f5' : isCompleted ? level.groupBg : 'white',
                      border: `3px solid ${isLocked ? '#e0e0e0' : isCurrent ? level.groupColor : isCompleted ? level.groupColor + '60' : '#e0e0e0'}`,
                      boxShadow: isCurrent ? `0 8px 32px ${level.groupColor}40` : '0 4px 12px rgba(0,0,0,0.06)',
                      opacity: isLocked ? 0.65 : 1,
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div className="flex items-center gap-5 p-5">
                      {/* Level number + emoji */}
                      <div className="relative flex-shrink-0">
                        <motion.div
                          animate={isCurrent ? { scale: [1,1.08,1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-sm"
                          style={{
                            background: isLocked ? '#e0e0e0' : level.isBoss ? 'linear-gradient(135deg,#ffd700,#ff9800)' : level.groupColor + '20',
                            border: `3px solid ${isLocked ? '#ccc' : level.groupColor}`,
                          }}
                        >
                          {isLocked ? '🔒' : level.emoji}
                        </motion.div>
                        {/* Level number badge */}
                        <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black" style={{ background: isLocked ? '#bdbdbd' : level.groupColor, color: 'white', border: '3px solid white' }}>
                          {level.levelNum}
                        </div>
                        {/* Pulse ring for current */}
                        {isCurrent && (
                          <motion.div
                            animate={{ scale: [1,1.5], opacity: [0.6,0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 rounded-2xl"
                            style={{ border: `4px solid ${level.groupColor}`, pointerEvents: 'none' }}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-2xl" style={{ color: isLocked ? '#9e9e9e' : '#171d14' }}>
                            {level.isWordLevel ? level.label : `${t('common.letter')} ${level.letter}`}
                          </span>
                          {level.isBoss && !isLocked && (
                            <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: '#fff9c4', color: '#f57f17' }}>{t('learning.boss')}</span>
                          )}
                          {isCurrent && (
                            <motion.span animate={{ opacity: [1,0.4,1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: level.groupColor, color: 'white' }}>{t('common.active')}</motion.span>
                          )}
                        </div>
                        <div className="text-sm mt-1 font-bold" style={{ color: '#6f7a6b' }}>
                          {level.completedCount}/{level.totalActivities} {t('parent.activities')}
                        </div>
                        {/* Mini star display */}
                        {!isLocked && (
                          <div className="flex items-center gap-1 mt-2">
                            {Array.from({ length: Math.min(level.totalPossibleStars, 12) }, (_, i) => (
                              <span key={i} style={{ fontSize: '14px', color: i < level.starsEarned ? '#ffa000' : '#e0e0e0' }}>★</span>
                            ))}
                            {level.totalPossibleStars > 12 && <span className="text-sm font-bold" style={{ color: '#9e9e9e' }}>+{level.totalPossibleStars - 12}</span>}
                          </div>
                        )}
                      </div>

                      {/* Status icon */}
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: level.groupColor }}>
                            <span className="material-symbols-outlined text-white" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>check</span>
                          </div>
                        ) : isCurrent ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: level.groupColor + '20', border: `2px solid ${level.groupColor}` }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: level.groupColor }}>play_arrow</span>
                          </div>
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#bdbdbd' }}>{isExpanded ? 'expand_less' : 'expand_more'}</span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {!isLocked && level.totalActivities > 0 && (
                      <div className="mx-3 mb-3">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e0e0e0' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(level.completedCount / level.totalActivities) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: isCompleted ? level.groupColor : `linear-gradient(90deg, ${level.groupColor}, ${level.groupColor}aa)` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Expanded activities */}
                  <AnimatePresence>
                    {isExpanded && !isLocked && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-2 pl-4">
                          {level.activities.map((act) => {
                            const p = activityProgress?.[act.Activity_ID];
                            const done = p?.completion_status === 'completed';
                            const stars = p?.stars_earned || 0;
                            const typeEmojis = { meet_letter:'👋', hear_sound:'👂', trace_write:'✏️', mini_quest:'⭐', sound_blender:'🎵', word_builder:'🧱', read_match:'📖' };

                            // Localize name
                            const content = parseContent(act.activity_content);
                            const letter = content.letter || content.targetLetter || "";
                            const word = content.word || content.targetWord || "";
                            const localizedName = t(`learning.activityNames.${act.activity_type}`, { letter, word }, act.activity_name);

                            return (
                              <motion.div
                                key={act.Activity_ID}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  console.log("Activity clicked in map:", act);
                                  onSelectActivity(act); 
                                }}
                                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                                style={{
                                  background: done ? level.groupBg : 'white',
                                  border: `1.5px solid ${done ? level.groupColor + '60' : '#e8e8e8'}`,
                                }}
                              >
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: done ? level.groupColor + '20' : '#f5f5f5' }}>
                                  {typeEmojis[act.activity_type] || '📚'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm truncate" style={{ color: '#171d14' }}>{localizedName}</div>
                                  <div className="text-xs" style={{ color: '#9e9e9e' }}>{act.estimated_duration_minutes || 5} {t('child.min')}</div>
                                </div>
                                {done ? (
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    {[1,2,3].map(i => <span key={i} style={{ fontSize: '14px', color: i <= stars ? '#ffa000' : '#e0e0e0' }}>★</span>)}
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: level.groupColor }}>
                                    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>play_arrow</span>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Connector dot between levels */}
              {filteredIdx < visibleLevels.length - 1 && (
                <div className={`flex ${isRight ? 'justify-start pl-12' : 'justify-end pr-12'}`}>
                  <motion.div
                    animate={isCurrent ? { opacity: [1,0.3,1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-6 flex flex-col items-center gap-1 justify-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: isCompleted ? level.groupColor : '#d0d0d0' }} />
                    <div className="w-0.5 flex-1" style={{ background: isCompleted ? level.groupColor + '60' : '#e8e8e8' }} />
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: isCompleted ? level.groupColor : '#d0d0d0' }} />
                  </motion.div>
                </div>
              )}
            </div>
          );
        })}

        {/* End cap */}
        <div className="text-center py-6">
          <div className="inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl" style={{ background: '#f5f5f5', border: '2px dashed #e0e0e0' }}>
            <span className="text-4xl">🎓</span>
            <span className="font-black text-sm" style={{ color: '#9e9e9e' }}>{t('learning.readingHero')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
