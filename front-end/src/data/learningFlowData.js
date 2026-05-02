// Learning Flow Data for each course
// Standardized 8-Step Sequential Learning Flow (A-H)
// Ground Rules: Intro -> A (Why) -> B (Story) -> C (Framework) -> D (Practice) -> E (Flash Cards) -> F (Adv Practice) -> G (Case Study) -> H (Notes)

export const LEARNING_FLOW_DATA = {
  'S01': {
    id: 'S01',
    title: 'Self-Awareness Foundations',
    overview: 'This course helps you understand your strengths, weaknesses, values, and motivations.',
    transcription: `Welcome to Self-Awareness Foundations. We'll explore the importance of understanding yourself deeply.`,
    steps: {
      'A': {
        step: 'A', title: 'Why', subtitle: 'Purpose & Relevance', duration: '4 min', type: 'Read', contentType: 'video-text',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Self-awareness is the foundation of all development. Without it, growth is impossible. Understanding your strengths, weaknesses, values, and motivations is the first step toward personal and professional growth.`
      },
      'B': {
        step: 'B', title: 'Story', subtitle: 'Real-world Context', duration: '6 min', type: 'Narrative', contentType: 'video-text',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Sarah discovered her blind spots through 360-degree feedback, transforming her leadership. When she received feedback that she was interrupting others in meetings, she initially felt defensive. But by practicing self-awareness, she learned to pause before speaking and became a more inclusive leader.`
      },
      'C': {
        step: 'C', title: 'Framework', subtitle: 'Concept Explanation', duration: '7 min', type: 'Accordion', contentType: 'video-text',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `The Johari Window is a powerful framework for self-awareness with four quadrants:\n\n1. **Open Area**: Known to you and others\n2. **Blind Spot**: Known to others but not to you\n3. **Hidden Area**: Known to you but not to others\n4. **Unknown Area**: Unknown to both you and others\n\nThe goal is to expand your Open Area through feedback and self-disclosure.`
      },
      'D': {
        step: 'D', title: 'Practice', subtitle: 'Basic Application', duration: '8 min', type: 'SJT Rank', contentType: 'mcq',
        questions: [{
          question: 'Which response shows best self-awareness when receiving negative feedback?',
          options: ['Ask for specific examples to understand', 'Immediately disagree with the feedback', 'Ignore the feedback completely', 'Promise to fix everything without understanding'],
          correctAnswer: 0, explanation: 'Seeking clarification shows openness and a desire to understand, which are key aspects of self-awareness.'
        },
        {
          question: 'What is the primary benefit of knowing your blind spots?',
          options: ['You can defend yourself better', 'You can work on improving them', 'You can hide them from others', 'You can ignore them'],
          correctAnswer: 1, explanation: 'Knowing your blind spots allows you to actively work on improving areas that others see but you might not.'
        }]
      },
      'E': {
        step: 'E', title: 'Flash Cards', subtitle: 'Quick Revision', duration: '4 min', type: 'Flip Card', contentType: 'flashcard',
        cards: [
          { front: 'Open Area', back: 'Information known to both you and others. The goal is to expand this area.' },
          { front: 'Blind Spot', back: 'Information others know about you but you don\'t. Discovered through feedback.' },
          { front: 'Hidden Area', back: 'Information you know but keep hidden from others. Revealed through self-disclosure.' },
          { front: 'Unknown Area', back: 'Unknown to both you and others. Discovered through exploration and new experiences.' },
          { front: '360-degree feedback', back: 'A comprehensive feedback method from peers, subordinates, and supervisors to identify blind spots.' }
        ]
      },
      'F': {
        step: 'F', title: 'Advanced Practice', subtitle: 'Complex Application', duration: '10 min', type: 'SJT Rank ↑', contentType: 'advanced-mcq',
        content: `Scenario: You're managing a team as an introvert and notice some team members feel you're not visible enough.`,
        questions: [{
          question: 'What is the best approach to handle this situation?',
          options: ['Mimic extroverted leaders by being loud', 'Build trust through one-on-one conversations', 'Demand that team members adapt to your style', 'Ignore the feedback and continue as is'],
          correctAnswer: 1, explanation: 'Leverage your natural strengths by building deeper connections individually rather than trying to be someone you\'re not.'
        },
        {
          question: 'How can you use self-awareness to improve your leadership as an introvert?',
          options: ['Force yourself to be more outgoing', 'Recognize your communication style and adapt it', 'Avoid leadership positions', 'Only work with other introverts'],
          correctAnswer: 1, explanation: 'Self-awareness helps you understand your natural style and adapt it effectively without losing your authentic self.'
        }]
      },
      'G': {
        step: 'G', title: 'Case Study', subtitle: 'Real-world Analysis', duration: '12 min', type: 'Analysis', contentType: 'case-study',
        content: `Satya Nadella's transformation of Microsoft: From a "know-it-all" culture to a "learn-it-all" culture.\n\nWhen Nadella became CEO in 2014, Microsoft was struggling with internal competition and a fixed mindset. He introduced the concept of growth mindset and self-awareness at the organizational level.\n\nKey changes:\n- Leaders were encouraged to share their vulnerabilities\n- Feedback became a two-way street, not just top-down\n- The culture shifted from proving you're right to learning and growing\n\nResults: Microsoft's market cap increased from $300B to over $2T, and innovation flourished.`,
        mcq: {
          question: 'What was the core cultural shift at Microsoft under Nadella?',
          options: ['Focus on IQ and technical skills', 'From "know-it-all" to "learn-it-all" mindset', 'Increased competition between teams', 'More hierarchical structure'],
          correctAnswer: 1, explanation: 'The shift from a fixed mindset to a growth mindset, driven by self-awareness and continuous learning, was the key transformation.'
        }
      },
      'H': {
        step: 'H', title: 'Notes', subtitle: 'Personal Takeaways', duration: '5 min', type: 'Documentation', contentType: 'notes',
        content: `Record your key takeaways from this course. Consider:\n\n1. What are your top 3 strengths?\n2. What is one blind spot you discovered?\n3. What is one specific action you will take this week to improve your self-awareness?\n\nWrite your reflections below to personalize your learning journey.`
      }
    }
  },
  'S02': {
    id: 'S02',
    title: 'Emotional Intelligence Basics',
    overview: 'Learn to manage emotions in yourself and others.',
    transcription: `Welcome to EQ Basics. IQ gets you the job, EQ gets you promoted.`,
    steps: {
      'A': { step: 'A', title: 'Why', subtitle: 'Purpose & Relevance', duration: '4 min', type: 'Read', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Emotional Intelligence accounts for 58% of success in all jobs. It\'s the key to leadership, teamwork, and personal relationships.' },
      'B': { step: 'B', title: 'Story', subtitle: 'Real-world Context', duration: '6 min', type: 'Narrative', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Marcus learned that empathy is a leadership superpower. When a team member was going through a personal crisis, instead of focusing only on deadlines, he took time to understand and support. The team\'s productivity actually increased because they felt valued.' },
      'C': { step: 'C', title: 'Framework', subtitle: 'Concept Explanation', duration: '7 min', type: 'Accordion', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'The 4 Pillars of Emotional Intelligence:\n\n1. **Self-Awareness**: Recognizing your emotions\n2. **Self-Regulation**: Managing your emotions\n3. **Social Awareness**: Understanding others\' emotions\n4. **Relationship Management**: Building effective relationships' },
      'D': { step: 'D', title: 'Practice', subtitle: 'Basic Application', duration: '8 min', type: 'SJT Rank', contentType: 'mcq', questions: [{ question: 'How to handle a stressed peer?', options: ['Ignore them', 'Offer private support and listen', 'Publicly call them out', 'Report to HR immediately'], correctAnswer: 1, explanation: 'Private support shows empathy and social awareness.' }] },
      'E': { step: 'E', title: 'Flash Cards', subtitle: 'Quick Revision', duration: '4 min', type: 'Flip Card', contentType: 'flashcard', cards: [{ front: '6-second rule', back: 'Pause for 6 seconds to engage your rational brain before responding emotionally.' }, { front: 'Self-Regulation', back: 'The ability to control or redirect disruptive impulses and moods.' }] },
      'F': { step: 'F', title: 'Advanced Practice', subtitle: 'Complex Application', duration: '10 min', type: 'SJT Rank ↑', contentType: 'advanced-mcq', questions: [{ question: 'During a board meeting, someone insults your presentation. What do you do?', options: ['Respond with anger', 'Stay silent and resent it', 'Stay calm and walk through the data', 'Laugh it off nervously'], correctAnswer: 2, explanation: 'Emotional regulation allows you to respond professionally rather than react emotionally.' }] },
      'G': { step: 'G', title: 'Case Study', subtitle: 'Real-world Analysis', duration: '12 min', type: 'Analysis', contentType: 'case-study', content: 'Project Aristotle at Google: After studying 180+ teams, Google found that psychological safety was the #1 factor for high-performing teams. Teams where members felt safe to take risks and be vulnerable outperformed others.' },
      'H': { step: 'H', title: 'Notes', subtitle: 'Personal Takeaways', duration: '5 min', type: 'Documentation', contentType: 'notes', content: 'Your EQ growth plan. Write down situations where you can practice emotional intelligence this week.' }
    }
  },
  'S03': {
    id: 'S03',
    title: 'Time Management Mastery',
    overview: 'Master the art of managing your finite time.',
    transcription: `Welcome to Time Mastery. Prioritization is the ultimate productivity hack.`,
    steps: {
      'A': { step: 'A', title: 'Why', subtitle: 'Purpose & Relevance', duration: '4 min', type: 'Read', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Time is finite; impact is infinite if managed well. The most successful people don\'t manage time—they manage priorities and focus.' },
      'B': { step: 'B', title: 'Story', subtitle: 'Real-world Context', duration: '6 min', type: 'Narrative', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Priya stopped saying yes to everyone and started saying yes to results. By using the Eisenhower Matrix, she reduced her working hours by 20% while increasing her output and impact.' },
      'C': { step: 'C', title: 'Framework', subtitle: 'Concept Explanation', duration: '7 min', type: 'Accordion', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'The Eisenhower Matrix categorizes tasks into four quadrants:\n\n**Q1: Urgent & Important** - Do it now (crises, deadlines)\n**Q2: Not Urgent & Important** - Schedule it (planning, relationships)\n**Q3: Urgent & Not Important** - Delegate it (interruptions, some meetings)\n**Q4: Not Urgent & Not Important** - Delete it (time wasters)\n\nFocus on Q2 for long-term success.' },
      'D': { step: 'D', title: 'Practice', subtitle: 'Basic Application', duration: '8 min', type: 'SJT Rank', contentType: 'mcq', questions: [{ question: 'What is Q2 in the Eisenhower Matrix?', options: ['Fires and crises', 'Strategic growth and planning', 'Busy work and distractions', 'Time wasters'], correctAnswer: 1, explanation: 'Q2 is where you should spend most of your time for long-term success.' }] },
      'E': { step: 'E', title: 'Flash Cards', subtitle: 'Quick Revision', duration: '4 min', type: 'Flip Card', contentType: 'flashcard', cards: [{ front: 'Parkinson\'s Law', back: 'Work expands to fill the time available for its completion.' }, { front: 'Pareto Principle (80/20)', back: '80% of results come from 20% of efforts. Focus on high-impact activities.' }] },
      'F': { step: 'F', title: 'Advanced Practice', subtitle: 'Complex Application', duration: '10 min', type: 'SJT Rank ↑', contentType: 'advanced-mcq', questions: [{ question: 'You face a sudden workload spike with conflicting deadlines. What do you do?', options: ['Work overtime to finish everything', 'Refuse new work completely', 'Renegotiate timelines based on priority', 'Delegate blindly without context'], correctAnswer: 2, explanation: 'Renegotiating based on priority shows strategic time management and communication skills.' }] },
      'G': { step: 'G', title: 'Case Study', subtitle: 'Real-world Analysis', duration: '12 min', type: 'Analysis', contentType: 'case-study', content: 'Basecamp\'s 4-day workweeks: By implementing focused time and reducing meeting overload, Basecamp maintained productivity while improving work-life balance. The key was protecting deep work time and eliminating unnecessary coordination.' },
      'H': { step: 'H', title: 'Notes', subtitle: 'Personal Takeaways', duration: '5 min', type: 'Documentation', contentType: 'notes', content: 'Your ideal week plan. Map out your Q2 activities and commit to protecting your focused time.' }
    }
  }
};

export const getLearningFlowData = (courseId) => {
  return LEARNING_FLOW_DATA[courseId] || null;
};

export const getStepData = (courseId, stepId) => {
  const courseData = LEARNING_FLOW_DATA[courseId];
  if (!courseData) return null;
  return courseData.steps[stepId] || null;
};
