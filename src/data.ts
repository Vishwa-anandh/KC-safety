import type {
  AssessmentPeriod,
  DashboardSite,
  OwnerRecord,
  MasterRequirement,
  Performance,
  Requirement,
  ResponseValue,
  SectionSummary,
  SiteContacts,
} from "./types";

export const assessmentPeriods: AssessmentPeriod[] = ["2026 Q1", "2026 Q2", "2026 Q3"];
export const currentAssessmentPeriod: AssessmentPeriod = "2026 Q3";

export const assignedSite = {
  name: "Northstar Manufacturing",
  code: "KC-NSM-042",
  region: "North America",
  segment: "Family Care",
  updated: "14 Aug 2026, 10:38 IST",
};

export const initialSiteContacts: SiteContacts = {
  siteManager: "Jordan Lee",
  siteManagerEmail: "jordan.lee@example.com",
  environmentalLeader: "Elena Garcia",
  environmentalLeaderEmail: "elena.garcia@example.com",
  healthSafetyLeader: "Maya Patel",
  healthSafetyLeaderEmail: "maya.patel@example.com",
  occupationalHealthNurse: "Aisha Rahman",
  occupationalHealthNurseEmail: "aisha.rahman@example.com",
  regionalHealthSafetyLeader: "Noah Williams",
  regionalHealthSafetyEmail: "noah.williams@example.com",
  regionalEnvironmentalLeader: "Sofia Chen",
  regionalEnvironmentalEmail: "sofia.chen@example.com",
  regionalOccupationalHealthLeader: "Priya Nair",
  regionalOccupationalHealthEmail: "priya.nair@example.com",
};

export const sections: SectionSummary[] = [
  {
    id: "leadership",
    shortName: "Leadership",
    name: "Leadership & Engagement",
    description: "Accountability, participation, policy, and leadership review.",
    completion: 82,
    performance: "initial",
    questions: 68,
    gaps: 9,
    kind: "operating-system",
  },
  {
    id: "planning",
    shortName: "Planning",
    name: "Planning",
    description: "Risks, opportunities, legal obligations, and objectives.",
    completion: 68,
    performance: "emerging",
    questions: 94,
    gaps: 14,
    kind: "operating-system",
  },
  {
    id: "support",
    shortName: "Support",
    name: "Support",
    description: "Resources, competence, communication, and controlled information.",
    completion: 94,
    performance: "performing",
    questions: 77,
    gaps: 3,
    kind: "operating-system",
  },
  {
    id: "operation",
    shortName: "Operation",
    name: "Operation",
    description: "Operational controls, change management, and emergency readiness.",
    completion: 73,
    performance: "emerging",
    questions: 126,
    gaps: 21,
    kind: "operating-system",
  },
  {
    id: "evaluation",
    shortName: "Evaluation",
    name: "Performance Evaluation",
    description: "Monitoring, audits, leadership review, and performance analysis.",
    completion: 55,
    performance: "initial",
    questions: 83,
    gaps: 18,
    kind: "operating-system",
  },
  {
    id: "improvement",
    shortName: "Improvement",
    name: "Improvement",
    description: "Incident learning, corrective action, and continual improvement.",
    completion: 41,
    performance: "initial",
    questions: 62,
    gaps: 17,
    kind: "operating-system",
  },
  {
    id: "ps-machine-safety",
    shortName: "Machine safety",
    name: "Machine Safety Performance Standard",
    description: "Safeguarding, isolation, inspection, and verification controls.",
    completion: 88,
    performance: "emerging",
    questions: 38,
    gaps: 4,
    kind: "performance-standard",
  },
  {
    id: "ps-occupational-health",
    shortName: "Occupational health",
    name: "Occupational Health Performance Standard",
    description: "Exposure assessment, medical surveillance, and health protection.",
    completion: 64,
    performance: "initial",
    questions: 44,
    gaps: 11,
    kind: "performance-standard",
  },
];

export const initialRequirement: Requirement = {
  id: "leadership-accountability",
  number: "OS 1.2.1",
  title: "Leadership commitment and accountability",
  sectionId: "leadership",
  sectionName: "Leadership & Engagement",
  subsection: "1.2 Leadership commitment",
  requirementText:
    "Site leadership establishes, communicates, and demonstrates clear accountability for EHS&S performance. Responsibilities are integrated into normal business routines and reviewed at a defined cadence.",
  guidance: [
    "Assign clear EHS&S accountabilities to site leaders and people managers.",
    "Include EHS&S objectives and results in recurring leadership business reviews.",
    "Record decisions, actions, and follow-up ownership from leadership reviews.",
    "Make leaders visibly responsible for removing barriers and providing resources.",
  ],
  expectedEvidence: [
    "Current leadership accountability matrix or role profiles.",
    "Recent leadership review agenda, minutes, and action record.",
    "Examples of EHS&S objectives included in business operating reviews.",
  ],
  questions: [
    {
      id: "q-1",
      number: "1",
      text: "Are site leadership EHS&S responsibilities documented and communicated to the people who hold them?",
      response: "partial",
      period: currentAssessmentPeriod,
      action: {
        description: "Refresh the leadership accountability matrix and brief all newly appointed operations leaders.",
        owner: "Maya Patel",
      },
    },
    {
      id: "q-2",
      number: "2",
      text: "Are EHS&S objectives and results reviewed as part of the site's normal business operating rhythm?",
      response: "yes",
      period: currentAssessmentPeriod,
    },
    {
      id: "q-3",
      number: "3",
      text: "Do leadership reviews consistently record decisions, action owners, and follow-up completion?",
      response: "no",
      period: currentAssessmentPeriod,
      action: {
        description: "Introduce a standard action log for monthly leadership reviews and review overdue items at each meeting.",
        owner: "Daniel Brooks",
      },
    },
  ],
  evidence: [
    {
      id: "ev-1",
      type: "file",
      title: "Leadership accountability matrix",
      detail: "KC-NSM-EHS-RACI-v4.pdf · 1.8 MB",
      uploadedBy: "Maya Patel",
      uploadedAt: "12 Aug 2026",
    },
    {
      id: "ev-2",
      type: "link",
      title: "August operating review minutes",
      detail: "sharepoint.example.com/sites/northstar/ehss/reviews",
      uploadedBy: "Daniel Brooks",
      uploadedAt: "13 Aug 2026",
    },
  ],
};

export const requirements: Requirement[] = [
  initialRequirement,
  {
    id: "planning-risks-opportunities",
    number: "OS 2.1.3",
    title: "Risks, opportunities, and planning controls",
    sectionId: "planning",
    sectionName: "Planning",
    subsection: "2.1 Risks and opportunities",
    requirementText: "The site maintains a current view of EHS&S risks, opportunities, legal obligations, and improvement objectives.",
    guidance: [
      "Review significant risks and opportunities at a defined cadence.",
      "Connect identified risks to objectives, controls, and accountable owners.",
      "Record legal and other obligations that affect site planning.",
    ],
    expectedEvidence: ["Current risk register.", "Approved objectives and action plan.", "Applicable obligations register."],
    questions: [
      { id: "planning-q-1", number: "1", text: "Is the site risk and opportunity register current and approved?", response: "partial", period: currentAssessmentPeriod, action: { description: "Complete the quarterly risk review and publish the approved register.", owner: "" } },
      { id: "planning-q-2", number: "2", text: "Are measurable EHS&S objectives connected to the highest-priority risks?", response: "yes", period: currentAssessmentPeriod },
    ],
    evidence: [],
  },
  {
    id: "support-competence",
    number: "OS 3.2.1",
    title: "Competence and awareness",
    sectionId: "support",
    sectionName: "Support",
    subsection: "3.2 Competence",
    requirementText: "People performing work that can affect EHS&S performance are competent through appropriate education, training, or experience.",
    guidance: ["Define competence requirements by role.", "Evaluate training effectiveness.", "Retain current training and qualification records."],
    expectedEvidence: ["Role-based training matrix.", "Training completion records.", "Competence verification samples."],
    questions: [
      { id: "support-q-1", number: "1", text: "Are competence requirements defined for safety-critical roles?", response: "yes", period: currentAssessmentPeriod },
      { id: "support-q-2", number: "2", text: "Is training effectiveness evaluated and documented?", response: "yes", period: currentAssessmentPeriod },
    ],
    evidence: [],
  },
  {
    id: "operation-change",
    number: "OS 4.3.2",
    title: "Management of operational change",
    sectionId: "operation",
    sectionName: "Operation",
    subsection: "4.3 Change management",
    requirementText: "Planned and temporary changes are assessed before implementation so new EHS&S risks are understood and controlled.",
    guidance: ["Define when a change review is required.", "Include affected workers and technical specialists.", "Verify controls before the change is released."],
    expectedEvidence: ["Approved change requests.", "Pre-startup safety review records.", "Worker communication records."],
    questions: [
      { id: "operation-q-1", number: "1", text: "Are operational changes reviewed for EHS&S risk before implementation?", response: "no", period: currentAssessmentPeriod, action: { description: "", owner: "" } },
      { id: "operation-q-2", number: "2", text: "Are temporary changes tracked through closure or permanent approval?", response: null, period: currentAssessmentPeriod },
    ],
    evidence: [],
  },
  {
    id: "evaluation-monitoring",
    number: "OS 5.1.1",
    title: "Monitoring, measurement, and analysis",
    sectionId: "evaluation",
    sectionName: "Performance Evaluation",
    subsection: "5.1 Performance monitoring",
    requirementText: "The site monitors leading and lagging indicators needed to evaluate EHS&S performance and control effectiveness.",
    guidance: ["Define indicators and accountable owners.", "Review data quality before reporting.", "Escalate adverse trends and overdue actions."],
    expectedEvidence: ["Current KPI definition sheet.", "Monthly performance review.", "Escalation and follow-up records."],
    questions: [
      { id: "evaluation-q-1", number: "1", text: "Are leading and lagging indicators defined with owners and targets?", response: null, period: currentAssessmentPeriod },
      { id: "evaluation-q-2", number: "2", text: "Are adverse trends reviewed and acted on?", response: null, period: currentAssessmentPeriod },
    ],
    evidence: [],
  },
  {
    id: "improvement-corrective-action",
    number: "OS 6.1.1",
    title: "Corrective action and continual improvement",
    sectionId: "improvement",
    sectionName: "Improvement",
    subsection: "6.1 Improvement actions",
    requirementText: "The site identifies causes of nonconformities, implements proportionate corrective actions, and verifies their effectiveness.",
    guidance: ["Use a consistent cause-analysis method.", "Assign accountable owners.", "Verify effectiveness before considering an issue resolved."],
    expectedEvidence: ["Corrective action log.", "Cause analysis records.", "Effectiveness verification samples."],
    questions: [
      { id: "improvement-q-1", number: "1", text: "Are significant events subject to documented cause analysis?", response: "partial", period: currentAssessmentPeriod, action: { description: "Standardize cause-analysis quality reviews for significant events.", owner: "Maya Patel" } },
      { id: "improvement-q-2", number: "2", text: "Is action effectiveness verified before closure?", response: "partial", period: currentAssessmentPeriod, action: { description: "Add effectiveness checks to the action review cadence.", owner: "Daniel Brooks" } },
    ],
    evidence: [],
  },
  {
    id: "machine-safeguarding",
    number: "PS 7.2.1",
    title: "Machine safeguarding verification",
    sectionId: "ps-machine-safety",
    sectionName: "Machine Safety Performance Standard",
    subsection: "7.2 Safeguarding",
    requirementText: "Machines are protected by safeguards appropriate to the hazards and safeguards are verified before use.",
    guidance: ["Maintain a machine inventory.", "Document safeguarding assessments.", "Verify safeguards after maintenance or modification."],
    expectedEvidence: ["Machine safeguarding assessment.", "Guard inspection records.", "Corrective action records."],
    questions: [
      { id: "machine-q-1", number: "1", text: "Are safeguarding assessments current for machines in scope?", response: "no", period: currentAssessmentPeriod, action: { description: "Complete overdue safeguarding assessments for Line 4.", owner: "Elena Garcia" } },
      { id: "machine-q-2", number: "2", text: "Are safeguard inspections recorded at the required frequency?", response: "yes", period: currentAssessmentPeriod },
    ],
    evidence: [],
  },
  {
    id: "occupational-exposure",
    number: "OH 3.1.4",
    title: "Occupational exposure assessment",
    sectionId: "ps-occupational-health",
    sectionName: "Occupational Health Performance Standard",
    subsection: "3.1 Exposure assessment",
    requirementText: "Potential occupational health exposures are identified, assessed, and controlled using competent resources and representative data.",
    guidance: ["Maintain a current exposure inventory.", "Use qualified assessors and validated methods.", "Communicate results and required controls to affected workers."],
    expectedEvidence: ["Exposure inventory.", "Sampling reports.", "Worker communication and control verification."],
    questions: [
      { id: "occupational-q-1", number: "1", text: "Is the occupational exposure inventory current?", response: "yes", period: currentAssessmentPeriod },
      { id: "occupational-q-2", number: "2", text: "Are exposure assessments current for all priority similar exposure groups?", response: null, period: currentAssessmentPeriod },
    ],
    evidence: [],
  },
];

export const ownerRecords: OwnerRecord[] = [
  {
    id: "owner-1",
    program: "Leadership & Engagement",
    category: "Operating System",
    primaryName: "Maya Patel",
    primaryEmail: "maya.patel@example.com",
    backupName: "Daniel Brooks",
    backupEmail: "daniel.brooks@example.com",
  },
  {
    id: "owner-2",
    program: "Planning",
    category: "Operating System",
    primaryName: "Daniel Brooks",
    primaryEmail: "daniel.brooks@example.com",
    backupName: "Maya Patel",
    backupEmail: "maya.patel@example.com",
  },
  {
    id: "owner-support",
    program: "Support",
    category: "Operating System",
    primaryName: "Jordan Lee",
    primaryEmail: "jordan.lee@example.com",
    backupName: "Aisha Rahman",
    backupEmail: "aisha.rahman@example.com",
  },
  {
    id: "owner-operation",
    program: "Operation",
    category: "Operating System",
    primaryName: "Elena Garcia",
    primaryEmail: "elena.garcia@example.com",
    backupName: "Daniel Brooks",
    backupEmail: "daniel.brooks@example.com",
  },
  {
    id: "owner-evaluation",
    program: "Performance Evaluation",
    category: "Operating System",
    primaryName: "Daniel Brooks",
    primaryEmail: "daniel.brooks@example.com",
    backupName: "Maya Patel",
    backupEmail: "maya.patel@example.com",
  },
  {
    id: "owner-improvement",
    program: "Improvement",
    category: "Operating System",
    primaryName: "Maya Patel",
    primaryEmail: "maya.patel@example.com",
    backupName: "Jordan Lee",
    backupEmail: "jordan.lee@example.com",
  },
  {
    id: "owner-3",
    program: "Machine Safety",
    category: "Performance Standard",
    primaryName: "Elena Garcia",
    primaryEmail: "elena.garcia@example.com",
    backupName: "Noah Williams",
    backupEmail: "noah.williams@example.com",
  },
  {
    id: "owner-4",
    program: "Occupational Health",
    category: "Performance Standard",
    primaryName: "Aisha Rahman",
    primaryEmail: "aisha.rahman@example.com",
    backupName: "Maya Patel",
    backupEmail: "maya.patel@example.com",
  },
];

export const dashboardSites: DashboardSite[] = [
  {
    id: "northstar",
    name: "Northstar Manufacturing",
    code: "KC-NSM-042",
    region: "North America",
    segment: "Family Care",
    completion: 71,
    performance: "initial",
    gaps: 37,
    updated: "14 Aug 2026",
  },
  {
    id: "riverbend",
    name: "Riverbend Mill",
    code: "KC-RBM-018",
    region: "North America",
    segment: "Family Care",
    completion: 100,
    performance: "performing",
    gaps: 5,
    updated: "13 Aug 2026",
  },
  {
    id: "lakeview",
    name: "Lakeview Distribution",
    code: "KC-LVD-207",
    region: "North America",
    segment: "Professional",
    completion: 86,
    performance: "emerging",
    gaps: 18,
    updated: "12 Aug 2026",
  },
  {
    id: "cedar-grove",
    name: "Cedar Grove Operations",
    code: "KC-CGO-103",
    region: "EMEA",
    segment: "Personal Care",
    completion: 44,
    performance: "initial",
    gaps: 42,
    updated: "9 Aug 2026",
  },
  {
    id: "solstice",
    name: "Solstice Manufacturing",
    code: "KC-SOL-076",
    region: "Asia Pacific",
    segment: "Personal Care",
    completion: 92,
    performance: "performing",
    gaps: 7,
    updated: "14 Aug 2026",
  },
  {
    id: "harbor-point",
    name: "Harbor Point Distribution",
    code: "KC-HPD-221",
    region: "Latin America",
    segment: "Professional",
    completion: 0,
    performance: "not-assessed",
    gaps: 0,
    updated: "Not started",
  },
];

export const masterRequirements: MasterRequirement[] = [
  { id: "OS 1.2.1", title: "Leadership commitment and accountability", section: "Leadership & Engagement", version: "v4", status: "Published", siteIds: [] },
  { id: "OS 2.1.3", title: "Risks, opportunities, and planning controls", section: "Planning", version: "v4", status: "Published", siteIds: [] },
  { id: "OS 4.3.2", title: "Management of operational change", section: "Operation", version: "v3", status: "Published", siteIds: [] },
  { id: "PS 7.2.1", title: "Machine safeguarding verification", section: "Machine Safety", version: "v2", status: "Draft", siteIds: [] },
  { id: "OH 3.1.4", title: "Occupational exposure assessment", section: "Occupational Health", version: "v2", status: "Published", siteIds: [] },
];

export function performanceForResponse(response: ResponseValue): Performance {
  if (response === "no") return "initial";
  if (response === "partial") return "emerging";
  if (response === "yes") return "performing";
  return "not-assessed";
}

export function rollupPerformance(responses: ResponseValue[]): Performance {
  if (responses.some((response) => response === "no")) return "initial";
  if (responses.some((response) => response === "partial")) return "emerging";
  if (responses.length > 0 && responses.every((response) => response === "yes")) return "performing";
  return "not-assessed";
}

export function performanceLabel(performance: Performance) {
  return {
    initial: "Initial",
    emerging: "Emerging",
    performing: "Performing",
    "not-assessed": "Not assessed",
  }[performance];
}

export function responseLabel(response: ResponseValue) {
  if (!response) return "Not answered";
  return { no: "No", partial: "Partial", yes: "Yes" }[response];
}
