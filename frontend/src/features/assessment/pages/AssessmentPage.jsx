import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/shared/services/api";
import { toast } from "@/shared/stores/uiStore";
import { useT, useLang } from "@/shared/stores/langStore";
import { useChildStore } from "@/shared/stores/childStore";
import Spinner from "@/shared/components/ui/Spinner";
import LITERACY_QUESTIONS from "@/data/literacy_questions.json";

const OptionLettersEn = ["A", "B", "C", "D", "E", "F"];
const OptionLettersAr = ["أ", "ب", "ج", "د", "هـ", "و"];

// ─── FIX 1: chunkShuffle keeps reading blocks together AND preserves
//            the internal order within every block (passage always first).
const chunkShuffle = (qs) => {
  const chunks = [];
  let i = 0;
  while (i < qs.length) {
    const q = qs[i];
    if (q.group && q.group.startsWith("reading_block")) {
      const groupName = q.group;
      const groupItems = [];
      while (i < qs.length && qs[i].group === groupName) {
        groupItems.push(qs[i]);
        i++;
      }
      // Sort by order so the passage (reading_timed) is always first in its block
      groupItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      chunks.push(groupItems);
    } else {
      chunks.push([q]);
      i++;
    }
  }
  // Shuffle chunks (not individual questions inside reading blocks)
  for (let j = chunks.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [chunks[j], chunks[k]] = [chunks[k], chunks[j]];
  }
  return chunks.flat();
};

// ─── FIX 2: Audio via Web Speech API when there are no audio files.
//            Falls back gracefully; also handles real audio_url if provided.
const speakText = (text, lang = "en") => {
  if (!text || typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(String(text));
  utt.lang = lang === "ar" ? "ar-SA" : "en-US";
  utt.rate = 0.85;
  window.speechSynthesis?.speak(utt);
};

// ─── Helpers ────────────────────────────────────────────────────────────────

// Given the flat questions array and the current question,
// find the parent reading passage if this question depends on one.
const findParentPassage = (questions, q) => {
  if (!q.depends_on) return null;
  return questions.find((x) => x.id === q.depends_on) ?? null;
};

// Build a lookup: question.id → question (for depends_on resolution)
const buildIndex = (qs) => Object.fromEntries(qs.map((q) => [q.id, q]));

export default function AssessmentPage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const lang = useLang();
  const { setSelectedChild } = useChildStore();

  const [current, setCurrent] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState({});          // id → question
  const [assessmentId, setAssessmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);    // single-select value
  const [multiSelected, setMultiSelected] = useState([]); // multi-select values
  const [timeSpent, setTimeSpent] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isStarted, setIsStarted] = useState(false);
  const [childName, setChildName] = useState("");
  const [assessmentLang, setAssessmentLang] = useState("en");
  const audioRef = useRef(null);

  useEffect(() => {
    startAssessment();
  }, [childId]);

  const startAssessment = async () => {
    try {
      setLoading(true);
      const res = await api.post("/api/assessments/start", {
        child_id: parseInt(childId),
        assessment_type: "initial",
      });
      setAssessmentId(res.data.Assessment_ID);

      // Fetch child name for the welcome screen
      try {
        const cRes = await api.get(`/api/children/${childId}`);
        setChildName(cRes.data.name);
        setSelectedChild(cRes.data); // Set this child as selected child in the store
        const childNativeLang = cRes.data.native_language || "English";
        const targetLang = (childNativeLang.toLowerCase() === "arabic" || childNativeLang.toLowerCase() === "ar") ? "ar" : "en";
        setAssessmentLang(targetLang);
      } catch (e) {
        console.warn("Could not fetch child name", e);
      }

      const shuffled = chunkShuffle(LITERACY_QUESTIONS);
      setQuestions(shuffled);
      setQIndex(buildIndex(shuffled));
    } catch {
      toast.error("Failed to load assessment.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied!");
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          setRecordedAudio(blob);
          setIsRecording(false);
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve(recordedAudio);
      }
    });
  };

  // Timer resets on each new question
  useEffect(() => {
    if (done || loading || questions.length === 0) return;
    setTimeSpent(0);
    const interval = setInterval(() => setTimeSpent((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [current, done, loading, questions]);

  // Auto-start recording ONLY for Q11 (Tom's story)
  useEffect(() => {
    if (!done && !loading && questions.length > 0) {
      const q = questions[current];
      // Only auto-start recording for Q11 specifically
      if (q?.id === 11 && q?.type === "reading_timed" && !isRecording) {
        startRecording();
      }
      // Stop recording when moving away from Q11
      else if (q?.id !== 11 && isRecording) {
        stopRecording();
      }
    }
  }, [current, done, loading, questions]);

  // ─── FIX 2: playAudio handles both real URLs and text-to-speech keys
  const playAudio = useCallback((urlOrKey, fallbackText) => {
    if (!urlOrKey && !fallbackText) return;

    // In Arabic mode, if we have Arabic text provided, prefer TTS over English URLs
    if (assessmentLang === "ar" && fallbackText) {
      speakText(fallbackText, assessmentLang);
      return;
    }

    if (urlOrKey && (urlOrKey.startsWith("http") || urlOrKey.startsWith("/"))) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = urlOrKey;
        audioRef.current.play().catch((e) => {
          console.warn("Audio file failed, falling back to TTS", e);
          const fallback = fallbackText || urlOrKey
            .split("/")
            .pop()
            .replace(/\.[^.]+$/, "")
            .replace(/[_-]/g, " ");
          speakText(fallback, assessmentLang);
        });
      }
    } else {
      const spoken = fallbackText || (urlOrKey || "")
        .replace(/^(letter|word|sound)_/, "")
        .replace(/_/g, " ");
      speakText(spoken, assessmentLang);
    }
  }, [assessmentLang]);

  // ─── isMultiSelect: Q9 (image_adjective_selection) and Q18 (grammatical_elements_selection)
  const isMultiSelect = (q) =>
    q.type === "image_adjective_selection" ||
    q.type === "grammatical_elements_selection" ||
    q.type === "odd_letter_frequency";

  const toggleMulti = (val) => {
    setMultiSelected((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  };

  // ─── FIX 3: Correct answer evaluation handles multi-select properly
  const evaluateAnswer = (q, answer) => {
    // ─── Reading stories are always "correct" (time-based)
    if (q.type === "reading_timed") return true;

    if (isMultiSelect(q)) {
      if (q.type === "odd_letter_frequency") {
        const grid = q.stimulus?.grid_en || [];
        const correctLetter = (q.correct_answer_en || q.correct_answer || "").trim().toLowerCase();
        const pickedIndices = Array.isArray(answer) ? answer : [];
        if (pickedIndices.length !== 3) return false;
        return pickedIndices.every(idx => (grid[idx] || "").trim().toLowerCase() === correctLetter);
      }
      const correctSet = new Set();
      const cEn = q.correct_answers_en || q.correct_answers || [];
      const cAr = q.correct_answers_ar || [];
      if (cEn.length > 0 || cAr.length > 0) {
        cEn.forEach((x) => correctSet.add(String(x).trim().toLowerCase()));
        cAr.forEach((x) => correctSet.add(String(x).trim().toLowerCase()));
      } else if (q.options) {
        q.options
          .filter((o) => o.is_correct)
          .forEach((o) => {
            if (o.value_en) correctSet.add(String(o.value_en).trim().toLowerCase());
            if (o.value_ar) correctSet.add(String(o.value_ar).trim().toLowerCase());
            if (o.value) correctSet.add(String(o.value).trim().toLowerCase());
            if (o.name_en) correctSet.add(String(o.name_en).trim().toLowerCase());
            if (o.name_ar) correctSet.add(String(o.name_ar).trim().toLowerCase());
            if (o.label_en) correctSet.add(String(o.label_en).trim().toLowerCase());
            if (o.label_ar) correctSet.add(String(o.label_ar).trim().toLowerCase());
            if (typeof o === "string") correctSet.add(o.trim().toLowerCase());
          });
      }

      const picked = (Array.isArray(answer) ? answer : [answer]).map((x) =>
        String(x).trim().toLowerCase()
      );
      return picked.length > 0 && picked.every((v) => correctSet.has(v));
    }

    const correctEn = String(q.correct_answer_en || q.correct_answer || q.id || "").trim().toLowerCase();
    const correctAr = String(q.correct_answer_ar || "").trim().toLowerCase();
    const cleanAnswer = String(answer).trim().toLowerCase();

    // ─── For sentence questions (Q21, Q22) where correct answer might be multi-word
    if (q.type === "identify_verb_in_sentence" || q.type === "identify_subject_in_sentence") {
      const matchEn = correctEn && (correctEn.includes(cleanAnswer) || cleanAnswer.includes(correctEn));
      const matchAr = correctAr && (correctAr.includes(cleanAnswer) || cleanAnswer.includes(correctAr));
      return matchEn || matchAr;
    }

    return Boolean(cleanAnswer === correctEn || (correctAr && cleanAnswer === correctAr));
  };

  const handleNext = async (answer) => {
    const q = questions[current];
    const isCorrect = evaluateAnswer(q, answer);

    // Upload audio recording FIRST if this was Q11 with a recording
    let audioUploaded = false;
    if (q.type === "reading_timed" && q.id === 11 && (isRecording || recordedAudio)) {
      try {
        const blob = isRecording ? await stopRecording() : recordedAudio;
        if (blob) {
          const formData = new FormData();
          formData.append("file", blob, "reading.wav");

          // Upload audio before submitting the answer
          const audioResponse = await api.post(`/api/assessments/${assessmentId}/question/${q.id}/audio`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          // console.log("Audio uploaded successfully:", audioResponse.data);
          // audioUploaded = true;
          setRecordedAudio(null);
        }
      } catch (e) {
        console.error("Failed to upload recording", e);
        toast.error("Failed to save voice recording");
      }
    }

    // For Q11 with audio, skip answer submission since audio endpoint already saved it
    if (q.id === 11 && audioUploaded) {
      const ans = {
        question_id: q.id,
        question: q.title_en || q.instruction_en,
        selected: "Audio recording uploaded",
        correct: "",
        is_correct: true, // Reading timed is always correct
        time_spent: timeSpent,
      };

      const newAnswers = [...answers, ans];
      setAnswers(newAnswers);

      setSelected(null);
      setMultiSelected([]);
      setSelectedIndex(null);

      if (current + 1 >= questions.length) {
        finishAssessment(newAnswers);
      } else {
        setCurrent((prev) => prev + 1);
      }
      return;
    }

    const answerStr = Array.isArray(answer) ? JSON.stringify(answer) : String(answer);
    let correctStr = "";
    if (isMultiSelect(q)) {
      if (q.correct_answers_en) {
        correctStr = JSON.stringify(q.correct_answers_en);
      } else if (q.correct_answer_en || q.correct_answer) {
        correctStr = String(q.correct_answer_en || q.correct_answer);
      } else if (q.options) {
        correctStr = JSON.stringify(q.options.filter(o => o.is_correct).map(o => o.value_en || o.value || o.name_en || o.label_en));
      }
    } else {
      correctStr = String(q.correct_answer ?? q.correct_answer_en ?? "");
    }

    const ans = {
      question_id: q.id,
      question: q.title_en || q.instruction_en,
      selected: answerStr,
      correct: correctStr,
      is_correct: isCorrect,
      time_spent: timeSpent,
    };

    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);

    try {
      await api.post(`/api/assessments/${assessmentId}/answer`, {
        question_id: q.id,
        question_type: q.type,
        question_content: JSON.stringify(q),
        correct_answer: correctStr,
        child_answer: answerStr,
        is_correct: Boolean(isCorrect),
        time_spent_seconds: timeSpent,
      });
    } catch (e) {
      console.error("Failed to save answer", e);
    }

    setSelected(null);
    setMultiSelected([]);
    setSelectedIndex(null);

    if (current + 1 >= questions.length) {
      finishAssessment(newAnswers);
    } else {
      setCurrent((prev) => prev + 1);
    }
  };

  const finishAssessment = async (finalAnswers) => {
    setDone(true);
    setSubmitting(true);
    const correct = finalAnswers.filter((a) => a.is_correct).length;
    const accuracy = (correct / questions.length) * 100;
    try {
      const res = await api.post(`/api/assessments/${assessmentId}/complete`);
      setResult({
        correct: res.data.total_correct_answers || correct,
        total: questions.length,
        accuracy: res.data.accuracy_percentage || accuracy,
        level: res.data.ai_analysis?.dyslexia_level || res.data.ai_analysis?.literacy_level || 1,
      });

      // Refresh child data to get the updated level and new activities
      try {
        const { refreshChildren, updateChild, setSelectedChild } = useChildStore.getState();
        // First try to update the specific child's data
        if (res.data.Child_ID) {
          const childRes = await api.get(`/api/children/${res.data.Child_ID}`);
          updateChild(childRes.data);
          setSelectedChild(childRes.data); // Make sure the child we just assessed is selected!
        }
        // Then refresh all children to ensure we have the latest data
        await refreshChildren(api);
      } catch (err) {
        console.error("Failed to refresh child data after assessment:", err);
      }
    } catch {
      let level = 1;
      if (accuracy >= 80) level = 4;
      else if (accuracy >= 60) level = 3;
      else if (accuracy >= 40) level = 2;
      setResult({ correct, total: questions.length, accuracy, level });
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ────────────────────────────────────────────────────────────────────────

  // ─── FIX 4: Render the "display" letter (Q1–Q4, Q8)
  const renderDisplayLetter = (display) => {
    const s = q.stimulus;
    const finalDisplay = (assessmentLang === "ar" && s?.display_ar) ? s.display_ar : display;
    return (
      <div
        className="flex items-center justify-center w-28 h-28 rounded-3xl mx-auto mb-2 cursor-pointer select-none"
        style={{ background: "#e9f0e1", border: "3px solid #c8dfc0" }}
        onClick={() => speakText(finalDisplay, assessmentLang)}
        title="Click to hear"
      >
        <span className="font-black" style={{ fontSize: "72px", color: "#1b5e20", lineHeight: 1 }}>
          {finalDisplay}
        </span>
      </div>
    );
  };

  const renderLetterGrid = (grid, target, onSelect) => {
    const multi = isMultiSelect(q);
    const cols =
      grid.length === 9 ? 3 : grid.length === 16 ? 4 : Math.ceil(Math.sqrt(grid.length));
    return (
      <div
        className="grid gap-3 mt-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: cols === 3 ? "260px" : "340px",
        }}
      >
        {grid.map((letter, i) => {
          const isSelected = multi ? multiSelected.includes(i) : selectedIndex === i;
          return (
            <button
              key={i}
              onClick={() => {
                if (multi) {
                  setMultiSelected((prev) =>
                    prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                  );
                } else {
                  setSelectedIndex(i);
                  onSelect(letter);
                }
              }}
              className="w-16 h-16 rounded-xl font-black text-2xl flex items-center justify-center transition-all"
              style={{
                background: isSelected ? "#e9f0e1" : "#ffffff",
                border: `3px solid ${isSelected ? "#4caf50" : "#d0e8c8"}`,
                color: "#1b5e20",
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>
    );
  };

  // ─── FIX 6: Render sentence for Q21 / Q22 — highlight words as clickable
  const renderSentenceWords = (sentence, onWordClick) => {
    const words = sentence.split(/\s+/);
    return (
      <div className="flex flex-wrap justify-center gap-2 my-4">
        {words.map((word, i) => {
          const clean = word.replace(/[.,!?]/g, "");
          const isChosen = selected === clean;
          return (
            <button
              key={i}
              onClick={() => onWordClick(clean)}
              className="px-3 py-2 rounded-xl font-bold text-lg transition-all"
              style={{
                background: isChosen ? "#e9f0e1" : "#f4faf0",
                border: `2px solid ${isChosen ? "#4caf50" : "#c8dfc0"}`,
                color: isChosen ? "#006e1c" : "#1b5e20",
              }}
            >
              {word}
            </button>
          );
        })}
      </div>
    );
  };

  // ─── FIX 7: Render the passage for word/adjective/grammar location questions
  //            (Q16, Q17, Q18) — words are clickable
  const renderInteractiveText = (text, targetWord, onWordClick) => {
    const words = text.split(/\s+/);
    return (
      <div className="p-5 bg-white rounded-2xl shadow-inner text-left w-full border-2 border-primary-50 leading-loose">
        {words.map((word, i) => {
          const clean = word.replace(/[.,!?؟،]/g, "");
          const isChosen =
            (Array.isArray(multiSelected) && multiSelected.includes(clean)) ||
            selected === clean;
          return (
            <span
              key={i}
              onClick={() => onWordClick(clean)}
              onMouseEnter={(e) => {
                if (!isChosen) e.currentTarget.style.background = "#f0f7ec";
              }}
              onMouseLeave={(e) => {
                if (!isChosen) e.currentTarget.style.background = "transparent";
              }}
              className="cursor-pointer rounded-md transition-all"
              style={{
                background: isChosen ? "#c8e6c9" : "transparent",
                color: isChosen ? "#1b5e20" : "#374151",
                fontWeight: isChosen ? 700 : 500,
                fontSize: "1.15rem",
                padding: isChosen ? "2px 8px" : "2px 4px",
                border: isChosen ? "1px solid #4caf50" : "1px solid transparent",
              }}
            >
              {word}{" "}
            </span>
          );
        })}
      </div>
    );
  };

  // ─── Main stimulus renderer — now handles ALL question types
  const renderStimulus = () => {
    if (!q) return null;
    const s = q.stimulus;

    return (
      <div className="flex flex-col items-center gap-4 mb-4">

        {/* ── Parent passage for depends_on questions (Q12-14, Q16-18, Q24-25) ── */}
        {q.depends_on && (() => {
          const parent = qIndex[q.depends_on];
          const passageText = parent?.stimulus?.[`text_${assessmentLang}`] || parent?.stimulus?.text_en;
          if (!passageText) return null;

          // For word/adjective/grammar location (Q16, Q17, Q18) → interactive text
          if (
            q.type === "word_location_in_text" ||
            q.type === "adjective_location_in_text"
          ) {
            const target = s[`target_word_${assessmentLang}`] || s[`word_${assessmentLang}`] || s?.target_word_en || s?.word_en || q.correct_answer;
            const wordType = q.type === "adjective_location_in_text" ? "adjective" : "word";
            return (
              <div className="w-full">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#6f7a6b" }}>
                  {t("assessment.clickWord", {
                    type: t(`assessment.types.${wordType}`),
                    target
                  })}
                </p>
                {renderInteractiveText(passageText, target, (w) => setSelected(w))}
              </div>
            );
          }

          if (q.type === "grammatical_elements_selection") {
            return (
              <div className="w-full">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#6f7a6b" }}>
                  {t("assessment.clickCount", {
                    count: 3,
                    type: t(`assessment.types.${s?.target_type || "words"}s`)
                  })}
                </p>
                {renderInteractiveText(passageText, null, (w) => {
                  setMultiSelected((prev) =>
                    prev.includes(w)
                      ? prev.filter((x) => x !== w)
                      : prev.length < 3
                        ? [...prev, w]
                        : prev
                  );
                })}
                <p className="text-sm mt-2 font-bold" style={{ color: "#4caf50" }}>
                  {t("assessment.selectedCount", {
                    selected: multiSelected.join(", ") || "—",
                    count: multiSelected.length,
                    total: 3
                  })}
                </p>
              </div>
            );
          }

          // For comprehension questions (Q12–14, Q24–25) → read-only passage reminder
          return (
            <div className="p-4 bg-white rounded-2xl border-2 border-primary-50 text-left w-full">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#6f7a6b" }}>
                {t("assessment.storyLabel")}
              </p>
              <p className="text-base leading-relaxed" style={{ color: "#374151" }}>
                {s?.[`text_${assessmentLang}`] || s?.text_en || passageText}
              </p>
            </div>
          );
        })()}

        {/* Display the target word ONLY for sound-matching questions
            (i.e. NOT when this is a word-location question with a passage) */}
        {(s?.word_en || s?.target_word_en) &&
          !s?.display &&
          !q.depends_on &&
          q.type !== "word_location_in_text" &&
          q.type !== "adjective_location_in_text" && (
            <div
              className="flex items-center justify-center px-8 py-4 rounded-3xl mx-auto mb-2 cursor-pointer select-none"
              style={{ background: "#e9f0e1", border: "3px solid #c8dfc0" }}
              onClick={() => speakText(s[`word_${assessmentLang}`] || s[`target_word_${assessmentLang}`] || s.word_en || s.target_word_en, assessmentLang)}
              title="Click to hear"
            >
              <span
                className="font-black"
                style={{ fontSize: "48px", color: "#1b5e20", lineHeight: 1 }}
              >
                {s[`word_${assessmentLang}`] || s[`target_word_${assessmentLang}`] || s[`display_${assessmentLang}`] || s.word_en || s.target_word_en || s.display_en}
              </span>
            </div>
          )}

        {/* ── stimulus.display → big clickable letter (Q1–Q4, Q8) ── */}
        {s?.display && renderDisplayLetter(s.display)}

        {/* ── stimulus.audio_url or audio_key → speak button ── */}
        {(s?.audio_url || s?.audio_key) && (
          <button
            onClick={() => {
              const arabicText = s.spoken_word_ar || s.display_ar || s.word_ar || s.target_word_ar;
              playAudio(s[`audio_url_${assessmentLang}`] || s.audio_url || s.audio_key, arabicText);
            }}
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
            style={{ background: "#d1e4ff", color: "#00355d" }}
          >
            <span className="material-symbols-outlined text-4xl">volume_up</span>
          </button>
        )}

        {/* ── stimulus.image_url ── */}
        {s?.image_url && (
          <img
            src={s.image_url}
            alt="Question"
            className="max-w-full h-48 object-contain rounded-2xl shadow-sm bg-white p-2"
          />
        )}

        {/* ── stimulus.image_key → placeholder ── */}
        {s?.image_key && !s?.image_url && (
          <div
            className="w-48 h-40 rounded-2xl flex items-center justify-center text-sm font-bold"
            style={{ background: "#e9f0e1", color: "#6f7a6b", border: "2px dashed #c8dfc0" }}
          >
            {s.image_key}
          </div>
        )}

        {/* ── stimulus.text_en → reading passage (timed) ── */}
        {s?.text_en && !q.depends_on && (
          <div className="p-6 bg-white rounded-2xl shadow-inner text-left w-full border-2 border-primary-50">
            {q.type === "reading_timed" && (
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#6f7a6b" }}>
                {t(`assessment.story`)} 📖
              </p>
            )}
            <p className="text-xl leading-relaxed text-gray-800 font-medium">
              {s[`text_${assessmentLang}`] || s.text_en}
            </p>
          </div>
        )}

        {/* ── stimulus.sentence_en → word-click sentence (Q21, Q22) ── */}
        {s?.sentence_en && (
          <div className="w-full">
            <p className="text-base font-medium mb-1" style={{ color: "#374151" }}>
              {s[`sentence_${assessmentLang}`] || s.sentence_en}
            </p>
            {renderSentenceWords(s[`sentence_${assessmentLang}`] || s.sentence_en, (w) => setSelected(w))}
          </div>
        )}

        {/* ── stimulus.grid_en → letter grid (Q19, Q20) ── */}
        {(s?.grid_en || s?.grid_ar) && renderLetterGrid(s[`grid_${assessmentLang}`] || s.grid_en, s.target_letter, (l) => setSelected(l))}

        {/* ── Question title / instruction ── */}
        {q.type !== "reading_timed" &&
          q.type !== "letter_visual_discrimination" &&
          q.type !== "odd_letter_frequency" &&
          q.type !== "identify_verb_in_sentence" &&
          q.type !== "identify_subject_in_sentence" &&
          q.type !== "word_location_in_text" &&
          q.type !== "adjective_location_in_text" &&
          q.type !== "grammatical_elements_selection" && (
            <h2 className="text-2xl font-black text-gray-900 mt-2">
              {q[`title_${assessmentLang}`] || q[`instruction_${assessmentLang}`] || q.title_en || q.instruction_en}
            </h2>
          )}

        {/* Titles for grid/sentence questions */}
        {(q.type === "letter_visual_discrimination" ||
          q.type === "odd_letter_frequency" ||
          q.type === "identify_verb_in_sentence" ||
          q.type === "identify_subject_in_sentence") && (
            <h2 className="text-xl font-black text-gray-900">
              {q[`title_${assessmentLang}`] || q[`instruction_${assessmentLang}`] || q.title_en || q.instruction_en}
            </h2>
          )}
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────
  // GUARD RAILS
  // ────────────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="xl" />
      </div>
    );
  if (!questions || questions.length === 0)
    return <div className="p-10 text-center font-bold">No questions found!</div>;

  if (!isStarted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-lg w-full text-center p-12 space-y-8"
          style={{ fontFamily: "Lexend, sans-serif" }}
        >
          <div className="relative">
            <div
              className="w-32 h-32 rounded-full bg-[#ffdf9e] mx-auto flex items-center justify-center mb-6 shadow-xl"
              style={{ border: '8px solid white' }}
            >
              <span className="material-symbols-outlined text-6xl text-[#785900]">
                rocket_launch
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-[#171d14]">
              {t("assessment.readyTitle", { name: childName || "friend" })}
            </h1>
            <p className="text-xl text-[#3f4a3c] leading-relaxed">
              {t("assessment.readySub")}
            </p>
          </div>

          <div className="bg-[#eff6e7] p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-4 text-left">
              <span className="material-symbols-outlined text-[#4caf50]">volume_up</span>
              <p className="text-sm font-bold text-[#006e1c]">{t("assessment.soundCheck")}</p>
            </div>
            <div className="flex items-center gap-4 text-left">
              <span className="material-symbols-outlined text-[#4caf50]">mic</span>
              <p className="text-sm font-bold text-[#006e1c]">{t("assessment.micCheck")}</p>
            </div>
          </div>

          <button
            onClick={() => setIsStarted(true)}
            className="kid-btn w-full text-2xl py-6 shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            {t("assessment.letsGo")}
          </button>
        </motion.div>
      </div>
    );
  }

  const q = questions[current];
  const progress = (current / questions.length) * 100;

  // Decide if the "Next" button should be enabled
  const multi = isMultiSelect(q);
  const neededCount = q.correct_answers_count || 3;
  const canAdvance = multi
    ? multiSelected.length === neededCount
    : selected !== null;

  // Types that have their own advance mechanism (no Next button)
  const selfAdvancing =
    q.type === "reading_timed" ||
    q.type === "odd_letter_frequency" ||
    q.type === "identify_verb_in_sentence" ||
    q.type === "identify_subject_in_sentence" ||
    q.type === "word_location_in_text" ||
    q.type === "adjective_location_in_text";

  // ────────────────────────────────────────────────────────────────────────
  // DONE SCREEN
  // ────────────────────────────────────────────────────────────────────────

  if (done) {
    if (submitting)
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="xl" />
        </div>
      );
    return (
      <div
        className="flex items-center justify-center p-4 font-kid"
        style={{ fontFamily: "Lexend, sans-serif" }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card-kid w-full max-w-md text-center"
        >
          <div
            className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6"
            style={{ background: "#ffdf9e", boxShadow: "0 8px 24px rgba(255,143,0,0.3)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "56px", color: "#785900", fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>
          <h2 className="text-3xl font-black mb-2" style={{ color: "#171d14" }}>
            {t("assessment.complete")}
          </h2>
          <p className="text-lg mb-6" style={{ color: "#3f4a3c" }}>
            {t("assessment.scoreSummary", { correct: result?.correct, total: result?.total })}
          </p>
          <div
            className="rounded-2xl p-6 mb-8 flex flex-col gap-2"
            style={{ background: "#e9f0e1", border: "2px solid #ffffff" }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-black" style={{ color: "#4caf50" }}>
                {result?.accuracy?.toFixed(0)}%
              </span>
              <span
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: "#6f7a6b" }}
              >
                {t("assessment.accuracy")}
              </span>
            </div>
            <div
              className="h-px w-full my-2"
              style={{ background: "#becab9", opacity: 0.5 }}
            />
            <div className="text-xl font-bold" style={{ color: "#171d14" }}>
              {t("assessment.levelPlaced")} {result?.level}
            </div>
          </div>
          <button className="kid-btn" onClick={() => navigate("/learn")}>
            {t("assessment.startLearning")}
            <span className="material-symbols-outlined ml-2 align-middle">menu_book</span>
          </button>
        </motion.div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col pb-6 font-kid"
      style={{ fontFamily: "Lexend, sans-serif" }}
    >
      <audio ref={audioRef} hidden />

      {/* ── Header / progress bar ── */}
      <div className="flex items-center gap-4 mb-3 pt-2">
        <button
          onClick={() => navigate("/learn")}
          className="flex items-center justify-center w-12 h-12 rounded-full"
          style={{
            background: "#ffffff",
            color: "#171d14",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sm" style={{ color: "#171d14" }}>
              {t("assessment.questionOf", { current: current + 1, total: questions.length })}
            </span>
            <div
              className="flex items-center gap-1 font-bold text-sm"
              style={{ color: "#3f4a3c" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                timer
              </span>
              {timeSpent}s
            </div>
          </div>
          <div className="progress-track" style={{ height: "12px" }}>
            <motion.div animate={{ width: `${progress}%` }} className="progress-fill" />
          </div>
        </div>
      </div>

      {/* ── Question card ── */}
      <div className="flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            dir={assessmentLang === "ar" ? "rtl" : "ltr"}
            className="flex flex-col max-w-lg w-full mx-auto"
          >
            <div className="card-kid mb-6 text-center" style={{ padding: "24px" }}>
              {/* Group badge */}
              <div
                className="mb-4 inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ background: "#d1e4ff", color: "#00355d" }}
              >
                {t(`assessment.group.${q.group || q.type}`) || (q.group || q.type).replace(/_/g, " ")}
              </div>

              {renderStimulus()}
            </div>

            {/* ── Reading timed: record + finish button ── */}
            {q.type === "reading_timed" && (
              <div className="flex flex-col items-center gap-4">
                {/* Recording indicator and manual control - ONLY for Q11 */}
                {q.id === 11 && (
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className="w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg"
                      style={{
                        background: isRecording ? "#ffcdd2" : "#e9f0e1",
                        border: `4px solid ${isRecording ? "#e53935" : "#4caf50"}`,
                        color: isRecording ? "#b71c1c" : "#1b5e20",
                      }}
                    >
                      <span className="material-symbols-outlined text-4xl">
                        {isRecording ? "stop_circle" : "mic"}
                      </span>
                    </button>
                    {isRecording && (
                      <p className="font-bold text-red-600 animate-pulse">{t("assessment.recordingVoice")}</p>
                    )}
                    {!isRecording && recordedAudio && (
                      <p className="font-bold text-green-600">✓ {t("assessment.voiceRecorded")}</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handleNext("Finished Reading")}
                  className="kid-btn w-full max-sm"
                  style={{
                    opacity: 1,
                    pointerEvents: "auto",
                  }}
                >
                  {q.id === 11 && isRecording ? t("assessment.finishAndSave") : t("assessment.finishedReading")}
                </button>
              </div>
            )}

            {/* ── Grid / sentence self-select: confirm button ── */}
            {selfAdvancing && q.type !== "reading_timed" && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() =>
                    multi
                      ? handleNext(multiSelected)
                      : handleNext(selected)
                  }
                  disabled={!canAdvance}
                  className="kid-btn w-full max-w-sm"
                  style={{
                    opacity: canAdvance ? 1 : 0.5,
                    filter: canAdvance ? "none" : "grayscale(100%)",
                  }}
                >
                  {t("assessment.confirmAnswer")}
                </button>
              </div>
            )}

            {/* ── grammatical_elements_selection confirm ── */}
            {q.type === "grammatical_elements_selection" && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => handleNext(multiSelected)}
                  disabled={multiSelected.length !== neededCount}
                  className="kid-btn w-full max-w-sm"
                  style={{
                    opacity: multiSelected.length === neededCount ? 1 : 0.5,
                    filter: multiSelected.length === neededCount ? "none" : "grayscale(100%)",
                  }}
                >
                  {t("assessment.confirmWords", { count: neededCount })}
                </button>
              </div>
            )}

            {/* ── Standard options list ── */}
            {!selfAdvancing &&
              q.type !== "grammatical_elements_selection" &&
              q.options && (
                <div className={`grid gap-3 ${multi ? "grid-cols-2" : "grid-cols-1"}`}>
                  {q.options.map((option, i) => {
                    const optionValue =
                      option.id ||
                      option.image_key ||
                      option.audio_key ||
                      option.value_en ||
                      option.value ||
                      option.name_en ||
                      option.label_en ||
                      option;

                    // Display label for the child
                    const displayLabel =
                      option[`value_${assessmentLang}`] ||
                      option.value_en ||
                      option.value ||
                      option[`name_${assessmentLang}`] ||
                      option.name_en ||
                      option[`label_${assessmentLang}`] ||
                      option.label_en ||
                      (typeof option === "string" ? option : "");

                    const isSelected = multi
                      ? multiSelected.includes(optionValue)
                      : selected === optionValue;

                    return (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() =>
                          multi ? toggleMulti(optionValue) : setSelected(optionValue)
                        }
                        className="flex items-center p-4 rounded-2xl text-left font-bold transition-all text-lg gap-4"
                        style={{
                          background: isSelected ? "#e9f0e1" : "#ffffff",
                          border: `3px solid ${isSelected ? "#4caf50" : "#eff6e7"}`,
                          color: isSelected ? "#006e1c" : "#171d14",
                          boxShadow: isSelected
                            ? "0 4px 12px rgba(76,175,80,0.15)"
                            : "0 4px 12px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: isSelected ? "#4caf50" : "#eff6e7",
                            color: isSelected ? "#ffffff" : "#6f7a6b",
                          }}
                        >
                          {multi ? (isSelected ? "✓" : i + 1) : (assessmentLang === "ar" ? OptionLettersAr[i] : OptionLettersEn[i])}
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                          {option.image_url && (
                            <img
                              src={option.image_url}
                              alt=""
                              className="w-12 h-12 object-contain"
                            />
                          )}
                          {option.image_key && !option.image_url && (
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-xs"
                              style={{ background: "#e9f0e1", color: "#6f7a6b" }}
                            >
                              img
                            </div>
                          )}
                          <span>{displayLabel}</span>
                        </div>
                        {/* ─── FIX 2: option audio_key → speak on click ─── */}
                        {(option.audio_key || option.audio_url) && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(option.audio_url || option.audio_key, option[`word_${assessmentLang}`] || option[`name_${assessmentLang}`] || option[`label_${assessmentLang}`] || option[`value_${assessmentLang}`]);
                            }}
                            className="ml-auto w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer"
                            style={{ background: "#d1e4ff" }}
                            role="button"
                            tabIndex={0}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "18px", color: "#00355d" }}
                            >
                              volume_up
                            </span>
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Next button (standard questions only) ── */}
      {!selfAdvancing && q.type !== "grammatical_elements_selection" && (
        <div className="mt-6 max-w-lg w-full mx-auto">
          <button
            onClick={() => (multi ? handleNext(multiSelected) : handleNext(selected))}
            disabled={!canAdvance}
            className="kid-btn"
            style={{
              opacity: canAdvance ? 1 : 0.5,
              filter: canAdvance ? "none" : "grayscale(100%)",
              transform: canAdvance ? "translateY(0)" : "translateY(4px)",
              boxShadow: canAdvance ? "0 4px 0 0 #388e3c" : "none",
            }}
          >
            {current + 1 === questions.length ? t("assessment.finishAssessment") : t("assessment.nextQuestion")}
          </button>
        </div>
      )}
    </div>
  );
}