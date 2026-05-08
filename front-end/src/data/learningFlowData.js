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
      '1': {
        step: '1', title: 'Why', subtitle: 'Purpose & Relevance', duration: '4 min', contentType: 'video-text',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Self-awareness is the foundation of all development. Without it, growth is impossible. Understanding your strengths, weaknesses, values, and motivations is the first step toward personal and professional growth.`
      },
      '2': {
        step: '2', title: 'Story', subtitle: 'Real-world Context', duration: '6 min', contentType: 'video-text',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Sarah discovered her blind spots through 360-degree feedback, transforming her leadership. When she received feedback that she was interrupting others in meetings, she initially felt defensive. But by practicing self-awareness, she learned to pause before speaking and became a more inclusive leader.`
      },
      '3': {
        step: '3', title: 'Framework', subtitle: 'Concept Explanation', duration: '7 min', contentType: 'video-text',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `The Johari Window is a powerful framework for self-awareness with four quadrants:\n\n1. **Open Area**: Known to you and others\n2. **Blind Spot**: Known to others but not to you\n3. **Hidden Area**: Known to you but not to others\n4. **Unknown Area**: Unknown to both you and others\n\nThe goal is to expand your Open Area through feedback and self-disclosure.`
      },
      '4': {
        step: '4', title: 'Practice', subtitle: 'Basic Application', duration: '8 min', contentType: 'mcq',
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
      '5': {
        step: '5', title: 'Critique/Reflection', subtitle: 'Deep analysis', duration: '5 min', contentType: 'video-text',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        content: `Reflect on a recent interaction where you felt misunderstood. How did your own internal state contribute to that situation? What would you do differently if you had more self-awareness in that moment?`
      },
      '6': {
        step: '6', title: 'Game/Flashcards', subtitle: 'Quick Revision', duration: '4 min', contentType: 'flashcard',
        cards: [
          { front: 'Open Area', back: 'Information known to both you and others. The goal is to expand this area.' },
          { front: 'Blind Spot', back: 'Information others know about you but you don\'t. Discovered through feedback.' },
          { front: 'Hidden Area', back: 'Information you know but keep hidden from others. Revealed through self-disclosure.' },
          { front: 'Unknown Area', back: 'Unknown to both you and others. Discovered through exploration and new experiences.' }
        ]
      },
      '7': {
        step: '7', title: 'Advanced Practice', subtitle: 'Complex Application', duration: '10 min', contentType: 'advanced-mcq',
        content: `Scenario: You're managing a team as an introvert and notice some team members feel you're not visible enough.`,
        questions: [{
          question: 'What is the best approach to handle this situation?',
          options: ['Mimic extroverted leaders by being loud', 'Build trust through one-on-one conversations', 'Demand that team members adapt to your style', 'Ignore the feedback and continue as is'],
          correctAnswer: 1, explanation: 'Leverage your natural strengths by building deeper connections individually rather than trying to be someone you\'re not.'
        }]
      },
      '8': {
        step: '8', title: 'Case Study', subtitle: 'Real-world Analysis', duration: '12 min', contentType: 'case-study',
        content: `Satya Nadella's transformation of Microsoft: From a "know-it-all" culture to a "learn-it-all" culture.`,
        mcq: {
          question: 'What was the core cultural shift at Microsoft under Nadella?',
          options: ['Focus on IQ and technical skills', 'From "know-it-all" to "learn-it-all" mindset', 'Increased competition between teams', 'More hierarchical structure'],
          correctAnswer: 1, explanation: 'The shift from a fixed mindset to a growth mindset was the key.'
        }
      },
      '9': {
        step: '9', title: 'Notes', subtitle: 'Personal Takeaways', duration: '5 min', contentType: 'notes',
        content: `Record your key takeaways from this course.`,
        placeholder: 'What are your top 3 strengths? What blind spots will you work on?'
      }
    }
  },
  'S02': {
    id: 'S02',
    title: 'Emotional Intelligence Basics',
    overview: 'Learn to manage emotions in yourself and others.',
    steps: {
      '1': { step: '1', title: 'Why', subtitle: 'Purpose & Relevance', duration: '4 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Emotional Intelligence accounts for 58% of success in all jobs.' },
      '2': { step: '2', title: 'Story', subtitle: 'Real-world Context', duration: '6 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Marcus learned that empathy is a leadership superpower.' },
      '3': { step: '3', title: 'Framework', subtitle: 'Concept Explanation', duration: '7 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'The 4 Pillars of Emotional Intelligence.' },
      '4': { step: '4', title: 'Practice', subtitle: 'Basic Application', duration: '8 min', contentType: 'mcq', questions: [{ question: 'How to handle a stressed peer?', options: ['Ignore', 'Support', 'Call out', 'Report'], correctAnswer: 1 }] },
      '5': { step: '5', title: 'Critique/Reflection', subtitle: 'Deep analysis', duration: '5 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Think about a time you lost your temper. How did it affect those around you?' },
      '6': { step: '6', title: 'Game/Flashcards', subtitle: 'Quick Revision', duration: '4 min', contentType: 'flashcard', cards: [{ front: '6-second rule', back: 'Pause to engage rational brain.' }] },
      '7': { step: '7', title: 'Advanced Practice', subtitle: 'Complex Application', duration: '10 min', contentType: 'advanced-mcq', questions: [{ question: 'Insult during meeting?', options: ['Anger', 'Silence', 'Calm data', 'Laugh'], correctAnswer: 2 }] },
      '8': { step: '8', title: 'Case Study', subtitle: 'Real-world Analysis', duration: '12 min', contentType: 'case-study', content: 'Project Aristotle at Google: Psychological safety.' },
      '9': { step: '9', title: 'Notes', subtitle: 'Personal Takeaways', duration: '5 min', contentType: 'notes', content: 'Your EQ growth plan.' }
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
  },
  'PIQ01': {
    id: 'PIQ01',
    title: 'Growth Mindset',
    overview: 'Embrace challenges and transform your approach to learning and failure.',
    steps: {
      '1': { step: '1', title: 'Why', subtitle: 'Purpose & Relevance', duration: '4 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'A growth mindset is the belief that abilities can be developed through dedication and hard work.' },
      '2': { step: '2', title: 'Story', subtitle: 'Real-world Context', duration: '6 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'How Michael Jordan used failure as fuel to become the greatest basketball player of all time.' },
      '3': { step: '3', title: 'Framework', subtitle: 'Concept Explanation', duration: '7 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Fixed vs. Growth Mindset: The power of "Yet".' },
      '4': { step: '4', title: 'Practice', subtitle: 'Basic Application', duration: '8 min', contentType: 'mcq', questions: [{ question: 'What is a core trait of a growth mindset?', options: ['Avoiding challenges', 'Seeing effort as useless', 'Learning from criticism', 'Feeling threatened by others success'], correctAnswer: 2 }] },
      '5': { step: '5', title: 'Critique/Reflection', subtitle: 'Deep analysis', duration: '5 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Identify a "fixed mindset" trigger in your professional life. How can you reframe it?' },
      '6': { step: '6', title: 'Game/Flashcards', subtitle: 'Quick Revision', duration: '4 min', contentType: 'flashcard', cards: [{ front: 'Neuroplasticity', back: 'The brain\'s ability to form new neural connections throughout life.' }] },
      '7': { step: '7', title: 'Advanced Practice', subtitle: 'Complex Application', duration: '10 min', contentType: 'advanced-mcq', questions: [{ question: 'A project failed. What is the growth mindset response?', options: ['Blame external factors', 'Give up on that skill', 'Analyze the failure for lessons', 'Hide the result'], correctAnswer: 2 }] },
      '8': { step: '8', title: 'Case Study', subtitle: 'Real-world Analysis', duration: '12 min', contentType: 'case-study', content: 'Carol Dweck\'s research on students and the impact of praise on mindset.' },
      '9': { step: '9', title: 'Notes', subtitle: 'Personal Takeaways', duration: '5 min', contentType: 'notes', content: 'Commit to one growth mindset action this week.' }
    }
  },
  'AIQ01': {
    id: 'AIQ01',
    title: 'AI Tools & Applications',
    overview: 'Master the essential AI tools that are reshaping the professional landscape.',
    steps: {
      '1': { step: '1', title: 'Why', subtitle: 'Purpose & Relevance', duration: '4 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'AI is not a replacement for human intelligence, but an enhancer of it.' },
      '2': { step: '2', title: 'Story', subtitle: 'Real-world Context', duration: '6 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'How a small marketing team tripled their output using Generative AI tools.' },
      '3': { step: '3', title: 'Framework', subtitle: 'Concept Explanation', duration: '7 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'The AI Stack: LLMs, Image Generation, and Specialized Agents.' },
      '4': { step: '4', title: 'Practice', subtitle: 'Basic Application', duration: '8 min', contentType: 'mcq', questions: [{ question: 'What does LLM stand for?', options: ['Large Language Model', 'Linear Logic Map', 'Learned Language Machine', 'Logic Level Module'], correctAnswer: 0 }] },
      '5': { step: '5', title: 'Critique/Reflection', subtitle: 'Deep analysis', duration: '5 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Reflect on a repetitive task in your daily routine. How could AI automate or assist it?' },
      '6': { step: '6', title: 'Game/Flashcards', subtitle: 'Quick Revision', duration: '4 min', contentType: 'flashcard', cards: [{ front: 'Generative AI', back: 'AI that can create new content like text, images, or code.' }] },
      '7': { step: '7', title: 'Advanced Practice', subtitle: 'Complex Application', duration: '10 min', contentType: 'advanced-mcq', questions: [{ question: 'When using AI for research, what is critical?', options: ['Trusting every output', 'Fact-checking and verification', 'Copy-pasting directly', 'Using the shortest prompt possible'], correctAnswer: 1 }] },
      '8': { step: '8', title: 'Case Study', subtitle: 'Real-world Analysis', duration: '12 min', contentType: 'case-study', content: 'Github Copilot\'s impact on developer productivity and code quality.' },
      '9': { step: '9', title: 'Notes', subtitle: 'Personal Takeaways', duration: '5 min', contentType: 'notes', content: 'List three AI tools you will experiment with today.' }
    }
  },
  'SQ01': {
    id: 'SQ01',
    title: 'Sustainability Fundamentals',
    overview: 'Understand the intersection of business, society, and the environment.',
    steps: {
      '1': { step: '1', title: 'Why', subtitle: 'Purpose & Relevance', duration: '4 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Sustainability is no longer optional; it is a core business imperative for the 21st century.' },
      '2': { step: '2', title: 'Story', subtitle: 'Real-world Context', duration: '6 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'The journey of Patagonia: From a climbing gear company to a leader in corporate activism.' },
      '3': { step: '3', title: 'Framework', subtitle: 'Concept Explanation', duration: '7 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'The Triple Bottom Line: People, Planet, Profit.' },
      '4': { step: '4', title: 'Practice', subtitle: 'Basic Application', duration: '8 min', contentType: 'mcq', questions: [{ question: 'What are the three pillars of sustainability?', options: ['Economic, Social, Environmental', 'Financial, Legal, Political', 'Local, National, Global', 'Past, Present, Future'], correctAnswer: 0 }] },
      '5': { step: '5', title: 'Critique/Reflection', subtitle: 'Deep analysis', duration: '5 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'How does your current consumption pattern affect the environment? What is one change you can make?' },
      '6': { step: '6', title: 'Game/Flashcards', subtitle: 'Quick Revision', duration: '4 min', contentType: 'flashcard', cards: [{ front: 'Circular Economy', back: 'An economic system aimed at eliminating waste and the continual use of resources.' }] },
      '7': { step: '7', title: 'Advanced Practice', subtitle: 'Complex Application', duration: '10 min', contentType: 'advanced-mcq', questions: [{ question: 'What is "Greenwashing"?', options: ['Cleaning solar panels', 'Misleading marketing about environmental benefits', 'Recycling plastic bottles', 'Planting trees'], correctAnswer: 1 }] },
      '8': { step: '8', title: 'Case Study', subtitle: 'Real-world Analysis', duration: '12 min', contentType: 'case-study', content: 'The UN Sustainable Development Goals (SDGs) and their role in global development.' },
      '9': { step: '9', title: 'Notes', subtitle: 'Personal Takeaways', duration: '5 min', contentType: 'notes', content: 'Draft your personal sustainability manifesto.' }
    }
  }
};

export const getLearningFlowData = (courseId) => {
  // If we have specific data, return it
  if (LEARNING_FLOW_DATA[courseId]) {
    return LEARNING_FLOW_DATA[courseId];
  }

  // Fallback: Generate generic sample data so the player is never empty
  return {
    id: courseId,
    title: `Mastering ${courseId}`,
    overview: `A comprehensive guide to mastering the concepts within ${courseId}.`,
    steps: {
      '1': { step: '1', title: 'Why', subtitle: 'Purpose & Relevance', duration: '5 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: `Understanding the "Why" behind ${courseId} is critical for long-term retention and application.` },
      '2': { step: '2', title: 'Story', subtitle: 'Real-world Context', duration: '7 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Let\'s look at a real-world scenario where these principles solved a major challenge.' },
      '3': { step: '3', title: 'Framework', subtitle: 'Concept Explanation', duration: '8 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'The core framework for this module involves three main pillars of expertise.' },
      '4': { step: '4', title: 'Practice', subtitle: 'Basic Application', duration: '10 min', contentType: 'mcq', questions: [{ question: 'What is the primary focus of this module?', options: ['Theory', 'Practice', 'Both', 'None'], correctAnswer: 2 }] },
      '5': { step: '5', title: 'Critique/Reflection', subtitle: 'Deep analysis', duration: '6 min', contentType: 'video-text', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', content: 'Reflect on how you can apply these learnings in your current role.' },
      '6': { step: '6', title: 'Game/Flashcards', subtitle: 'Quick Revision', duration: '5 min', contentType: 'flashcard', cards: [{ front: 'Core Concept', back: 'The most important takeaway from this lesson.' }] },
      '7': { step: '7', title: 'Advanced Practice', subtitle: 'Complex Application', duration: '12 min', contentType: 'advanced-mcq', questions: [{ question: 'Which advanced strategy works best?', options: ['Strategy A', 'Strategy B', 'Strategy C', 'Strategy D'], correctAnswer: 1 }] },
      '8': { step: '8', title: 'Case Study', subtitle: 'Real-world Analysis', duration: '15 min', contentType: 'case-study', content: 'Analysis of a successful implementation in a Fortune 500 company.' },
      '9': { step: '9', title: 'Notes', subtitle: 'Personal Takeaways', duration: '5 min', contentType: 'notes', content: 'Record your final thoughts and action items.' }
    }
  };
};

export const getStepData = (courseId, stepId) => {
  const courseData = getLearningFlowData(courseId);
  if (!courseData) return null;
  return courseData.steps[stepId] || null;
};
