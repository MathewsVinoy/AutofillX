const VAULT_SCHEMA = [
  {
    section: "Personal information",
    fields: [
      {
        key: "firstName",
        label: "First name",
        type: "text",
        match: ["first.?name", "given.?name", "fname"],
      },
      {
        key: "middleName",
        label: "Middle name",
        type: "text",
        match: ["middle.?name", "mname"],
      },
      {
        key: "lastName",
        label: "Last name",
        type: "text",
        match: ["last.?name", "surname", "family.?name", "lname"],
      },
      {
        key: "fullName",
        label: "Full name",
        type: "text",
        match: ["full.?name", "^name$", "your.?name", "applicant.?name"],
      },
      {
        key: "preferredName",
        label: "Preferred / nick name",
        type: "text",
        match: ["preferred.?name", "nick.?name"],
      },
      {
        key: "email",
        label: "Email address",
        type: "email",
        match: ["e.?mail"],
      },
      {
        key: "phone",
        label: "Phone number",
        type: "tel",
        match: ["phone", "mobile", "cell", "telephone"],
      },
      {
        key: "phoneAlt",
        label: "Alternate phone",
        type: "tel",
        match: ["alt.*phone", "secondary.*phone", "home.?phone"],
      },
      {
        key: "dob",
        label: "Date of birth",
        type: "date",
        match: ["date.?of.?birth", "birth.?date", "^dob$"],
      },
      {
        key: "gender",
        label: "Gender",
        type: "text",
        match: ["gender", "^sex$"],
      },
      { key: "pronouns", label: "Pronouns", type: "text", match: ["pronoun"] },
      {
        key: "nationality",
        label: "Nationality",
        type: "text",
        match: ["nationality", "citizenship"],
      },
      {
        key: "maritalStatus",
        label: "Marital status",
        type: "text",
        match: ["marital.?status"],
      },
    ],
  },
  {
    section: "Address",
    fields: [
      {
        key: "street1",
        label: "Street address",
        type: "text",
        match: ["address.?line.?1", "street.?address", "^address$", "^street$"],
      },
      {
        key: "street2",
        label: "Apt / suite / unit",
        type: "text",
        match: ["address.?line.?2", "apt", "suite", "unit"],
      },
      { key: "city", label: "City", type: "text", match: ["city", "town"] },
      {
        key: "state",
        label: "State / Province",
        type: "text",
        match: ["state", "province", "region"],
      },
      {
        key: "zip",
        label: "ZIP / Postal code",
        type: "text",
        match: ["zip", "postal.?code", "postcode"],
      },
      { key: "country", label: "Country", type: "text", match: ["country"] },
    ],
  },
  {
    section: "Professional",
    fields: [
      {
        key: "jobTitle",
        label: "Current job title",
        type: "text",
        match: ["job.?title", "^title$", "position", "current.?role"],
      },
      {
        key: "employer",
        label: "Current employer",
        type: "text",
        match: ["employer", "company.?name", "current.?company"],
      },
      { key: "industry", label: "Industry", type: "text", match: ["industry"] },
      {
        key: "yearsExperience",
        label: "Years of experience",
        type: "text",
        match: ["years.*experience", "yoe"],
      },
      {
        key: "linkedin",
        label: "LinkedIn URL",
        type: "url",
        match: ["linkedin"],
      },
      {
        key: "website",
        label: "Personal website",
        type: "url",
        match: ["website", "personal.?site"],
      },
      { key: "github", label: "GitHub URL", type: "url", match: ["github"] },
      {
        key: "portfolio",
        label: "Portfolio URL",
        type: "url",
        match: ["portfolio"],
      },
      {
        key: "desiredSalary",
        label: "Desired salary",
        type: "text",
        match: [
          "desired.?salary",
          "salary.?expectation",
          "expected.?salary",
          "compensation",
        ],
      },
      {
        key: "availabilityDate",
        label: "Availability / start date",
        type: "date",
        match: ["start.?date", "availability", "available.?from"],
      },
      {
        key: "noticePeriod",
        label: "Notice period",
        type: "text",
        match: ["notice.?period"],
      },
    ],
  },
  {
    section: "Education",
    fields: [
      {
        key: "highestDegree",
        label: "Highest degree",
        type: "text",
        match: ["highest.?degree", "^degree$", "education.?level"],
      },
      {
        key: "school",
        label: "School / University",
        type: "text",
        match: ["school", "university", "college", "institution"],
      },
      {
        key: "major",
        label: "Major / Field of study",
        type: "text",
        match: ["major", "field.?of.?study", "course.?of.?study"],
      },
      { key: "minor", label: "Minor", type: "text", match: ["^minor$"] },
      {
        key: "graduationYear",
        label: "Graduation year",
        type: "text",
        match: ["graduation.?year", "grad.?year"],
      },
      {
        key: "gpa",
        label: "GPA",
        type: "text",
        match: ["gpa", "grade.?point"],
      },
    ],
  },
  {
    section: "Work authorization",
    fields: [
      {
        key: "workAuthStatus",
        label: "Work authorization status",
        type: "text",
        match: [
          "work.?authoriz",
          "authorized.?to.?work",
          "legally.?authorized",
        ],
      },
      {
        key: "visaSponsorship",
        label: "Need visa sponsorship?",
        type: "text",
        match: ["sponsorship", "visa.?status", "require.?visa"],
      },
      {
        key: "relocate",
        label: "Willing to relocate?",
        type: "text",
        match: ["relocat"],
      },
      {
        key: "remotePreference",
        label: "Remote / hybrid / onsite preference",
        type: "text",
        match: ["remote.?preference", "work.?location.?preference", "hybrid"],
      },
    ],
  },
  {
    section: "Emergency contact",
    fields: [
      {
        key: "emergencyName",
        label: "Emergency contact name",
        type: "text",
        match: ["emergency.?contact.?name", "emergency.?name"],
      },
      {
        key: "emergencyPhone",
        label: "Emergency contact phone",
        type: "tel",
        match: ["emergency.?contact.?phone", "emergency.?phone"],
      },
      {
        key: "emergencyRelationship",
        label: "Emergency contact relationship",
        type: "text",
        match: ["emergency.*relationship"],
      },
    ],
  },
  {
    section: "Additional / EEO (voluntary)",
    fields: [
      {
        key: "coverLetterSummary",
        label: "Short bio / cover letter summary",
        type: "textarea",
        match: [
          "cover.?letter",
          "summary",
          "about.?you",
          "additional.?information",
        ],
      },
      {
        key: "skills",
        label: "Skills (comma separated)",
        type: "textarea",
        match: ["skills"],
      },
      {
        key: "languages",
        label: "Languages spoken",
        type: "text",
        match: ["languages?"],
      },
      {
        key: "references",
        label: "References",
        type: "textarea",
        match: ["references?"],
      },
      {
        key: "veteranStatus",
        label: "Veteran status",
        type: "text",
        match: ["veteran"],
      },
      {
        key: "disabilityStatus",
        label: "Disability status",
        type: "text",
        match: ["disability"],
      },
      {
        key: "ethnicity",
        label: "Race / ethnicity",
        type: "text",
        match: ["ethnicity", "race"],
      },
    ],
  },
  {
    section: "Sensitive identifiers",
    sensitive: true,
    fields: [
      {
        key: "ssn",
        label: "Social Security / National ID number",
        type: "text",
        sensitive: true,
        match: ["social.?security", "^ssn$", "national.?id"],
      },
      {
        key: "driverLicense",
        label: "Driver's license number",
        type: "text",
        sensitive: true,
        match: ["driver.?licen[sc]e"],
      },
      {
        key: "passportNumber",
        label: "Passport number",
        type: "text",
        sensitive: true,
        match: ["passport"],
      },
    ],
  },
];

const _globalTarget2 = typeof self !== "undefined" ? self : window;
_globalTarget2.VAULT_SCHEMA = VAULT_SCHEMA;
