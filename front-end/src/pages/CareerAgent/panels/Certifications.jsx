import React, { useState } from 'react';
import { Award, ExternalLink, ShieldCheck, Clock, BookOpen, Star, ChevronRight, Cpu, BrainCircuit, Building2 } from 'lucide-react';

const technicalCerts = [
  {
    id: 1,
    name: "Meta Back-End Developer Professional Certificate",
    provider: "Coursera",
    skills: ["Python", "Django", "APIs", "Git", "SQL"],
    url: "https://www.coursera.org/professional-certificates/meta-back-end-developer",
    level: "Beginner",
    duration: "8 Months",
    color: "var(--accent)"
  },
  {
    id: 2,
    name: "IBM Full Stack Software Developer",
    provider: "Coursera",
    skills: ["React", "Express", "Node.js", "Python"],
    url: "https://www.coursera.org/professional-certificates/ibm-full-stack-cloud-developer",
    level: "Intermediate",
    duration: "10 Months",
    color: "var(--accent2)"
  },
  {
    id: 3,
    name: "AWS Certified Developer – Associate",
    provider: "AWS Training",
    skills: ["Serverless", "Security", "CI/CD", "Databases"],
    url: "https://aws.amazon.com/certification/certified-developer-associate/",
    level: "Intermediate",
    duration: "130 Hours",
    color: "var(--amber)"
  },
  {
    id: 4,
    name: "Microsoft Certified: Azure Developer",
    provider: "Microsoft Learn",
    skills: ["Azure", "Docker", "Cosmos DB", "C#"],
    url: "https://learn.microsoft.com/en-us/certifications/azure-developer/",
    level: "Intermediate",
    duration: "Self-Paced",
    color: "#00a4ef"
  },
  {
    id: 5,
    name: "Google Professional Cloud Developer",
    provider: "Google Cloud",
    skills: ["Kubernetes", "Cloud Native", "Performance"],
    url: "https://cloud.google.com/certification/cloud-developer",
    level: "Advanced",
    duration: "Self-Paced",
    color: "#34a853"
  },
  {
    id: 6,
    name: "Meta Front-End Developer",
    provider: "Coursera",
    skills: ["React", "JavaScript", "UI/UX", "CSS"],
    url: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
    level: "Beginner",
    duration: "7 Months",
    color: "var(--accent)"
  },
  {
    id: 7,
    name: "Oracle Certified Professional: Java SE",
    provider: "Oracle",
    skills: ["Java", "OOP", "Concurrency"],
    url: "https://education.oracle.com/java-se-11-developer/pexam_1Z0-819",
    level: "Intermediate",
    duration: "Self-Paced",
    color: "#e34f26"
  },
  {
    id: 8,
    name: "Certified Kubernetes App Developer",
    provider: "Linux Foundation",
    skills: ["Kubernetes", "Microservices", "Containers"],
    url: "https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad/",
    level: "Advanced",
    duration: "Self-Paced",
    color: "#326ce5"
  }
];

const aiCerts = [
  {
    id: 11,
    name: "DeepLearning.AI TensorFlow Developer",
    provider: "Coursera",
    skills: ["TensorFlow", "Deep Learning", "CNNs", "NLP"],
    url: "https://www.coursera.org/professional-certificates/tensorflow-in-practice",
    level: "Intermediate",
    duration: "4 Months",
    color: "#ff6f00"
  },
  {
    id: 12,
    name: "IBM AI Engineering Professional Certificate",
    provider: "Coursera",
    skills: ["Machine Learning", "PyTorch", "Computer Vision"],
    url: "https://www.coursera.org/professional-certificates/ai-engineer",
    level: "Intermediate",
    duration: "8 Months",
    color: "var(--accent2)"
  },
  {
    id: 13,
    name: "Microsoft Certified: Azure AI Engineer",
    provider: "Microsoft Learn",
    skills: ["Azure AI", "Cognitive Services", "NLP"],
    url: "https://learn.microsoft.com/en-us/certifications/azure-ai-engineer/",
    level: "Intermediate",
    duration: "Self-Paced",
    color: "#00a4ef"
  },
  {
    id: 14,
    name: "AWS Certified AI Practitioner",
    provider: "AWS Training",
    skills: ["Generative AI", "Foundational Models", "Prompt Eng"],
    url: "https://aws.amazon.com/certification/certified-ai-practitioner/",
    level: "Beginner",
    duration: "60 Hours",
    color: "var(--amber)"
  },
  {
    id: 15,
    name: "Google Cloud Professional ML Engineer",
    provider: "Google Cloud",
    skills: ["MLOps", "Model Architecture", "Data Pipelines"],
    url: "https://cloud.google.com/certification/machine-learning-engineer",
    level: "Advanced",
    duration: "Self-Paced",
    color: "#34a853"
  },
  {
    id: 16,
    name: "Andrew Ng's Machine Learning Specialization",
    provider: "DeepLearning.AI",
    skills: ["Supervised ML", "Unsupervised IT", "Recommender Systems"],
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    level: "Beginner",
    duration: "2 Months",
    color: "var(--accent)"
  }
];

const domainCerts = [
  {
    id: 21,
    name: "Certified ScrumMaster (CSM)",
    provider: "Scrum Alliance",
    skills: ["Agile", "Scrum", "Team Facilitation"],
    url: "https://www.scrumalliance.org/get-certified/scrum-master-track/certified-scrummaster",
    level: "Beginner",
    duration: "2 Days",
    color: "#00558c"
  },
  {
    id: 22,
    name: "Project Management Professional (PMP)",
    provider: "PMI",
    skills: ["Project Mgmt", "Risk Analysis", "Resource Allocation"],
    url: "https://www.pmi.org/certifications/project-management-pmp",
    level: "Advanced",
    duration: "Self-Paced",
    color: "#5b248a"
  },
  {
    id: 23,
    name: "ITIL 4 Foundation",
    provider: "Axelos",
    skills: ["IT Service Mgmt", "Process Optimization", "Value Co-creation"],
    url: "https://www.axelos.com/certifications/itil-service-management",
    level: "Beginner",
    duration: "Self-Paced",
    color: "#008a9f"
  },
  {
    id: 24,
    name: "AWS Certified Cloud Practitioner",
    provider: "AWS Training",
    skills: ["Cloud Economics", "Business Strategy", "High-Level Architecture"],
    url: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
    level: "Beginner",
    duration: "10 Hours",
    color: "var(--amber)"
  },
  {
    id: 25,
    name: "TOGAF 9 Foundation",
    provider: "The Open Group",
    skills: ["Enterprise Architecture", "Business IT Alignment"],
    url: "https://www.opengroup.org/certifications/togaf",
    level: "Intermediate",
    duration: "Self-Paced",
    color: "#ab1c20"
  }
];

const Certifications = ({ roleName }) => {
  const [activeTab, setActiveTab] = useState('technical');
  const [hoveredId, setHoveredId] = useState(null);

  const tabs = [
    { id: 'technical', label: 'Technical Skills', icon: <Cpu size={16} /> },
    { id: 'ai', label: 'AI & Data Skills', icon: <BrainCircuit size={16} /> },
    { id: 'domain', label: 'Domain Skills', icon: <Building2 size={16} /> }
  ];

  const getDisplayCerts = () => {
    switch (activeTab) {
      case 'ai': return aiCerts;
      case 'domain': return domainCerts;
      default: return technicalCerts;
    }
  };

  const displayCerts = getDisplayCerts();

  return (
    <div style={{ marginTop: '1rem', animation: 'fadeIn 0.5s ease-out' }}>

      {/* Introduction Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79, 142, 247, 0.1), rgba(79, 142, 247, 0.02))',
        border: '1px solid rgba(79, 142, 247, 0.25)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'rgba(79, 142, 247, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, border: '2px solid rgba(79,142,247,0.4)',
            boxShadow: '0 0 20px rgba(79, 142, 247, 0.2)'
          }}>
            <Award size={28} color="var(--accent)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.3rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Top Recommended Certifications
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0, maxWidth: '550px' }}>
              Boost your profile as a <strong style={{ color: 'var(--text2)' }}>{roleName || 'Software Developer'}</strong> by acquiring these industry-recognized credentials.
            </p>
          </div>
        </div>

        {/* Tabs - Now aligned next to title */}
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          background: 'linear-gradient(135deg, rgba(79, 142, 247, 0.12), rgba(167, 139, 250, 0.08))',
          border: '1px solid rgba(79, 142, 247, 0.2)',
          padding: '0.45rem',
          borderRadius: '12px',
          width: 'fit-content',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text2)',
                border: 'none',
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: activeTab === tab.id ? 700 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: activeTab === tab.id ? '0 4px 14px rgba(79, 142, 247, 0.4)' : 'none',
                transform: activeTab === tab.id ? 'translateY(-1px)' : 'none'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1.5rem',
        paddingBottom: '2rem'
      }}>
        {displayCerts.map((cert) => (
          <a
            key={cert.id}
            href={cert.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHoveredId(cert.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              textDecoration: 'none',
              background: 'var(--navy2)',
              border: `1px solid ${hoveredId === cert.id ? cert.color : 'var(--border)'}`,
              borderRadius: '16px',
              padding: '1.5rem',
              transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
              transform: hoveredId === cert.id ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: hoveredId === cert.id ? `0 12px 24px -8px ${cert.color}40` : '0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Badge Overlay Glow */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '100px',
              height: '100px',
              background: cert.color,
              filter: 'blur(40px)',
              opacity: hoveredId === cert.id ? 0.3 : 0.05,
              transition: 'opacity 0.4s'
            }}></div>

            {/* Provider & Icon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.7rem',
                borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600',
                color: 'var(--text2)', border: '1px solid var(--border)'
              }}>
                <ShieldCheck size={14} color={cert.color} />
                {cert.provider}
              </div>
              <div style={{
                color: hoveredId === cert.id ? 'var(--text)' : 'var(--muted)',
                transition: 'color 0.3s',
                display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600
              }}>
                View Course <ExternalLink size={14} />
              </div>
            </div>

            {/* Certificate Title */}
            <h4 style={{
              fontSize: '1.1rem',
              color: 'var(--text)',
              marginBottom: '1rem',
              lineHeight: '1.4',
              flex: 1
            }}>
              {cert.name}
            </h4>

            {/* Meta Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                <Star size={14} color="var(--amber)" />
                {cert.level}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                <Clock size={14} color="var(--accent)" />
                {cert.duration}
              </div>
            </div>

            {/* Skills */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem',
              marginTop: 'auto',
              paddingTop: '1rem',
              borderTop: '1px dashed var(--border)'
            }}>
              <div style={{ width: '100%', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={12} /> Skills Covered
              </div>
              {cert.skills.map((skill, idx) => (
                <span key={idx} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text2)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {skill}
                </span>
              ))}
            </div>

            {/* Hover arrow indicator */}
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              opacity: hoveredId === cert.id ? 1 : 0,
              transform: hoveredId === cert.id ? 'translateX(0)' : 'translateX(-10px)',
              transition: 'all 0.3s ease',
              color: cert.color
            }}>
              <ChevronRight size={20} />
            </div>

          </a>
        ))}
      </div>
    </div>
  );
};

export default Certifications;
