// Big Five trait explanations for different levels
export const big5Explanations = {
    openness: {
        name: 'Openness to Experience',
        Low: 'You tend to prefer familiar routines and conventional approaches. You may be more practical and traditional in your thinking, valuing stability and established methods over novelty.',
        Moderate: 'You balance appreciation for new experiences with comfort in familiar situations. You can be creative when needed but also value practical, proven approaches.',
        High: 'You are highly curious, imaginative, and open to new ideas and experiences. You enjoy exploring novel concepts, appreciate art and beauty, and tend to think abstractly and creatively.',
    },
    conscientiousness: {
        name: 'Conscientiousness',
        Low: 'You tend to be more spontaneous and flexible, preferring to go with the flow rather than strict planning. You may prioritize immediate experiences over long-term organization.',
        Moderate: 'You can be organized when necessary but also flexible when situations require it. You balance planning with spontaneity and can adapt your approach as needed.',
        High: 'You are highly organized, disciplined, and goal-oriented. You plan carefully, pay attention to details, and consistently work toward your objectives with strong self-control.',
    },
    extraversion: {
        name: 'Extraversion',
        Low: 'You tend to be more reserved and introspective, preferring solitude or small groups. You may find energy in quiet reflection and feel drained by extensive social interaction.',
        Moderate: 'You balance social engagement with alone time. You can enjoy both group activities and solitary pursuits, adapting to different social situations as needed.',
        High: 'You are outgoing, energetic, and thrive in social situations. You enjoy being around people, seek excitement and stimulation, and tend to be talkative and assertive.',
    },
    agreeableness: {
        name: 'Agreeableness',
        Low: 'You tend to be more competitive and skeptical, prioritizing objectivity over harmony. You may be direct in your communication and comfortable with conflict when necessary.',
        Moderate: 'You balance cooperation with assertiveness. You can be compassionate and helpful while also standing firm when your interests or values are at stake.',
        High: 'You are compassionate, cooperative, and value harmony in relationships. You tend to be trusting, helpful, and considerate of others\' feelings and needs.',
    },
    neuroticism: {
        name: 'Neuroticism (Emotional Stability)',
        Low: 'You tend to be emotionally stable, calm, and resilient. You handle stress well and maintain composure in challenging situations, rarely experiencing intense negative emotions.',
        Moderate: 'You experience a normal range of emotional responses. You can handle most stressors effectively but may feel anxious or upset in particularly challenging situations.',
        High: 'You may experience emotions more intensely and be more sensitive to stress. You might worry frequently and feel anxious or moody, though this also means you\'re highly attuned to your environment.',
    },
    emotionalStability: {
        name: 'Emotional Stability',
        Low: 'You may experience emotions more intensely and be more sensitive to stress. You might find it challenging to maintain composure in difficult situations and may need extra support during stressful times.',
        Moderate: 'You demonstrate a balanced emotional response to life\'s challenges. You can manage stress reasonably well while still being in touch with your emotions.',
        High: 'You are emotionally stable, calm, and resilient. You handle stress exceptionally well, maintain composure in challenging situations, and rarely experience intense negative emotions. You recover quickly from setbacks.',
    },
};

// Function to get color based on level
export const getLevelColor = (level) => {
    if (level === 'High') return '#166534'; // dark green
    if (level === 'Moderate') return '#22c55e'; // medium green
    return '#86efac'; // light green
};
