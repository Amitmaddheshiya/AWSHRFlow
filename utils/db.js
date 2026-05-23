const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dns = require('dns').promises;
const { app } = require('electron');
const { MongoClient } = require('mongodb');

let db;
let mongoClient = null;
let mongoDb = null;
let mongoReady = false;

const ENV_FILE = path.join(__dirname, '..', '.env.local');
const MONGO_DB_NAME = 'AWSHRFlow';
const MONGO_COMPANIES_COLLECTION = 'companies';
const MONGO_EMPLOYEES_COLLECTION = 'employees';

const DEFAULT_COMPANIES = [
  {
    code: 'nextview',
    displayName: 'Nextview Technologies (INDIA) Pvt Ltd',
    legalName: 'Nextview Technologies (INDIA) Pvt Ltd',
    address: `409-410 Maurya Atria,
Nr. Atithi Restaurant Cross Road,
Bodakdev, Ahmedabad-380054`,
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    postalCode: '380054',
    phone: '1800 270 0139, 9925149964',
    email: 'info@nexttechgroup.com',
    website: 'www.nexttechgroup.com',
    contactPerson: 'HR Department',
    hrName: 'HR Department',
    directorName: 'Authorized Signatory',
    logoData: '',
    stampData: '',
    signatureData: '',
    cin: '',
    gstin: '',
    pan: '',
    tan: '',
    pfRegistrationNo: '',
    esicRegistrationNo: '',
    bankName: '',
    bankAccountNumber: '',
    ifsc: '',
    paymentMode: 'Bank Transfer',
    defaultPfEnabled: 1,
    defaultPtEnabled: 1,
    defaultPfAmount: 1800,
    defaultPtAmount: 200,
    salaryCalculationBase: 'full-month',
    tdsRule: '',
    payslipNote: 'This is a computer-generated payslip and does not require a signature.',
    documentFooter: 'This document is system generated for official HR use.'
  },
  {
    code: '3view',
    displayName: '3 View Trade LLP',
    legalName: '3 View Trade LLP',
    address: `T F 3, Shakti Square,
Opp Management Enclave,
Nehru Park Road, Vastrapur,
Ahmedabad 380015`,
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    postalCode: '380015',
    phone: '9904310022',
    email: 'info@nexttechgroup.com',
    website: 'www.nexttechgroup.com',
    contactPerson: 'HR Department',
    hrName: 'HR Department',
    directorName: 'Authorized Signatory',
    logoData: '',
    stampData: '',
    signatureData: '',
    cin: '',
    gstin: '',
    pan: '',
    tan: '',
    pfRegistrationNo: '',
    esicRegistrationNo: '',
    bankName: '',
    bankAccountNumber: '',
    ifsc: '',
    paymentMode: 'Bank Transfer',
    defaultPfEnabled: 0,
    defaultPtEnabled: 0,
    defaultPfAmount: 0,
    defaultPtAmount: 0,
    salaryCalculationBase: 'full-month',
    tdsRule: '',
    payslipNote: 'This is a computer-generated payslip and does not require a signature.',
    documentFooter: 'This document is system generated for official HR use.'
  },
  {
    code: 'nexttech',
    displayName: "Next Tech IT'S Care",
    legalName: "Next Tech IT'S Care",
    address: `409-410 Maurya Atria,
Nr. Atithi Hotel,
Near Kasturi Tower,
Bodakdev, Ahmedabad-380054`,
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    postalCode: '380054',
    phone: '9033009558, 9510529827',
    email: 'info@nexttechgroup.com',
    website: 'www.nexttechgroup.com',
    contactPerson: 'HR Department',
    hrName: 'HR Department',
    directorName: 'Authorized Signatory',
    logoData: '',
    stampData: '',
    signatureData: '',
    cin: '',
    gstin: '',
    pan: '',
    tan: '',
    pfRegistrationNo: '',
    esicRegistrationNo: '',
    bankName: '',
    bankAccountNumber: '',
    ifsc: '',
    paymentMode: 'Bank Transfer',
    defaultPfEnabled: 0,
    defaultPtEnabled: 0,
    defaultPfAmount: 0,
    defaultPtAmount: 0,
    salaryCalculationBase: 'full-month',
    tdsRule: '',
    payslipNote: 'This is a computer-generated payslip and does not require a signature.',
    documentFooter: 'This document is system generated for official HR use.'
  }
];

const COMPANY_COLUMNS = [
  ['code', 'TEXT UNIQUE'],
  ['displayName', 'TEXT'],
  ['legalName', 'TEXT'],
  ['address', 'TEXT'],
  ['city', 'TEXT'],
  ['state', 'TEXT'],
  ['country', 'TEXT'],
  ['postalCode', 'TEXT'],
  ['phone', 'TEXT'],
  ['email', 'TEXT'],
  ['website', 'TEXT'],
  ['contactPerson', 'TEXT'],
  ['hrName', 'TEXT'],
  ['directorName', 'TEXT'],
  ['logoData', 'TEXT'],
  ['stampData', 'TEXT'],
  ['signatureData', 'TEXT'],
  ['cin', 'TEXT'],
  ['gstin', 'TEXT'],
  ['pan', 'TEXT'],
  ['tan', 'TEXT'],
  ['pfRegistrationNo', 'TEXT'],
  ['esicRegistrationNo', 'TEXT'],
  ['bankName', 'TEXT'],
  ['bankAccountNumber', 'TEXT'],
  ['ifsc', 'TEXT'],
  ['paymentMode', 'TEXT'],
  ['defaultPfEnabled', 'INTEGER DEFAULT 0'],
  ['defaultPtEnabled', 'INTEGER DEFAULT 0'],
  ['defaultPfAmount', 'REAL DEFAULT 0'],
  ['defaultPtAmount', 'REAL DEFAULT 0'],
  ['salaryCalculationBase', 'TEXT DEFAULT "full-month"'],
  ['tdsRule', 'TEXT'],
  ['payslipNote', 'TEXT'],
  ['documentFooter', 'TEXT'],
  ['customFields', 'TEXT'],
  ['createdAt', 'TEXT DEFAULT CURRENT_TIMESTAMP'],
  ['updatedAt', 'TEXT DEFAULT CURRENT_TIMESTAMP']
];

const EMPLOYEE_COLUMNS = [
  ['name', 'TEXT'],
  ['employeeId', 'TEXT'],
  ['designation', 'TEXT'],
  ['department', 'TEXT'],
  ['company', 'TEXT'],
  ['companyId', 'INTEGER'],
  ['doj', 'TEXT'],
  ['location', 'TEXT'],
  ['bankName', 'TEXT'],
  ['accountNumber', 'TEXT'],
  ['ifsc', 'TEXT'],
  ['pfNo', 'TEXT'],
  ['pfUAN', 'TEXT'],
  ['pfDeductAmount', 'REAL DEFAULT 0'],
  ['esiNo', 'TEXT'],
  ['pan', 'TEXT'],
  ['basic', 'REAL DEFAULT 0'],
  ['hra', 'REAL DEFAULT 0'],
  ['specialAllowance', 'REAL DEFAULT 0'],
  ['mobileNumber', 'TEXT'],
  ['email', 'TEXT'],
  ['address', 'TEXT'],
  ['aadhaar', 'TEXT'],
  ['employmentType', 'TEXT'],
  ['reportingManager', 'TEXT'],
  ['bonus', 'REAL DEFAULT 0'],
  ['ctc', 'REAL DEFAULT 0'],
  ['emergencyContact', 'TEXT'],
  ['profilePhoto', 'TEXT'],
  ['customFields', 'TEXT'],
  ['createdAt', 'TEXT DEFAULT CURRENT_TIMESTAMP'],
  ['updatedAt', 'TEXT DEFAULT CURRENT_TIMESTAMP']
];

const POLICY_COLUMNS = [
  ['companyId', 'INTEGER'],
  ['policyType', 'TEXT'],
  ['policyCode', 'TEXT'],
  ['title', 'TEXT'],
  ['version', 'TEXT'],
  ['effectiveDate', 'TEXT'],
  ['reviewDate', 'TEXT'],
  ['ownerDepartment', 'TEXT'],
  ['approverName', 'TEXT'],
  ['status', 'TEXT'],
  ['summary', 'TEXT'],
  ['purpose', 'TEXT'],
  ['scope', 'TEXT'],
  ['applicability', 'TEXT'],
  ['policyRules', 'TEXT'],
  ['workflow', 'TEXT'],
  ['exceptions', 'TEXT'],
  ['disciplinaryAction', 'TEXT'],
  ['createdAt', 'TEXT DEFAULT CURRENT_TIMESTAMP'],
  ['updatedAt', 'TEXT DEFAULT CURRENT_TIMESTAMP']
];

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

function buildEmployeeIdPrefix(companyCode) {
  return String(companyCode || '')
    .trim();
}

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    return;
  }

  const contents = fs.readFileSync(ENV_FILE, 'utf8');
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

function envFlag(name) {
  return ['1', 'true', 'yes', 'on'].includes(String(process.env[name] || '').trim().toLowerCase());
}

function parseMongoSrvUri(mongoUri) {
  const match = String(mongoUri || '').match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)(?:\/([^?]*))?/i);
  if (!match) {
    return null;
  }

  return {
    username: match[1],
    password: match[2],
    host: match[3],
    databaseName: match[4] || MONGO_DB_NAME
  };
}

async function buildConnectionCandidates(mongoUri) {
  const candidates = [mongoUri];
  const parsed = parseMongoSrvUri(mongoUri);
  if (!parsed) {
    return candidates;
  }

  try {
    const srvRecords = await dns.resolveSrv(`_mongodb._tcp.${parsed.host}`);
    if (!srvRecords.length) {
      return candidates;
    }

    const hostList = srvRecords
      .map((record) => `${record.name}:${record.port}`)
      .join(',');

    candidates.push(
      `mongodb://${parsed.username}:${parsed.password}@${hostList}/${parsed.databaseName}?tls=true&authSource=admin&retryWrites=true&w=majority`
    );
  } catch (error) {
    // Ignore DNS fallback failure; the base URI is still attempted.
  }

  return candidates;
}

function mongoCollection(name) {
  return mongoReady && mongoDb ? mongoDb.collection(name) : null;
}

function stripMongoId(doc) {
  if (!doc) {
    return doc;
  }

  const { _id, ...rest } = doc;
  return rest;
}

async function nextMongoNumericId(collectionName) {
  const collection = mongoCollection(collectionName);
  const highest = await collection.find({}, { projection: { id: 1 } }).sort({ id: -1 }).limit(1).next();
  return Number(highest?.id || 0) + 1;
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function ensureColumns(tableName, columns) {
  const tableInfo = await all(`PRAGMA table_info(${tableName})`);
  const existingColumns = new Set(tableInfo.map((column) => column.name));

  for (const [name, definition] of columns) {
    if (!existingColumns.has(name)) {
      const safeDefinition = definition
        .replace(/\s+UNIQUE\b/i, '')
        .replace(/\s+DEFAULT\s+CURRENT_TIMESTAMP\b/i, '');
      await run(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${safeDefinition}`);
    }
  }
}

async function ensureIndexes() {
  await run('CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_code_unique ON companies(code)');
}

async function seedDefaultCompanies() {
  const countRow = await get('SELECT COUNT(*) AS count FROM companies');
  if ((countRow?.count || 0) > 0) {
    return;
  }

  for (const company of DEFAULT_COMPANIES) {
    await run(
      `INSERT INTO companies (
        code, displayName, legalName, address, city, state, country, postalCode, phone,
        email, website, contactPerson, hrName, directorName, logoData, stampData,
        signatureData, cin, gstin, pan, tan, pfRegistrationNo, esicRegistrationNo,
        bankName, bankAccountNumber, ifsc, paymentMode, defaultPfEnabled,
        defaultPtEnabled, defaultPfAmount, defaultPtAmount, salaryCalculationBase, tdsRule, payslipNote, documentFooter
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        company.code,
        company.displayName,
        company.legalName,
        company.address,
        company.city,
        company.state,
        company.country,
        company.postalCode,
        company.phone,
        company.email,
        company.website,
        company.contactPerson,
        company.hrName,
        company.directorName,
        company.logoData,
        company.stampData,
        company.signatureData,
        company.cin,
        company.gstin,
        company.pan,
        company.tan,
        company.pfRegistrationNo,
        company.esicRegistrationNo,
        company.bankName,
        company.bankAccountNumber,
        company.ifsc,
        company.paymentMode,
        company.defaultPfEnabled,
        company.defaultPtEnabled,
        company.defaultPfAmount,
        company.defaultPtAmount,
        company.salaryCalculationBase,
        company.tdsRule,
        company.payslipNote,
        company.documentFooter
      ]
    );
  }
}

async function backfillEmployeeCompanyIds() {
  const companies = await all('SELECT id, code FROM companies');
  const companyMap = new Map(companies.map((company) => [company.code, company.id]));
  const employees = await all('SELECT id, company, companyId FROM employees');

  for (const employee of employees) {
    if (!employee.companyId && employee.company && companyMap.has(employee.company)) {
      await run(
        'UPDATE employees SET companyId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [companyMap.get(employee.company), employee.id]
      );
    }
  }
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT
    )
  `);

  await ensureColumns('companies', COMPANY_COLUMNS);
  await ensureColumns('employees', EMPLOYEE_COLUMNS);
  await ensureColumns('policies', POLICY_COLUMNS);
  await seedDefaultCompanies();
  await backfillEmployeeCompanyIds();
  await ensureIndexes();
}

async function seedMongoFromSqliteIfEmpty() {
  const companiesCollection = mongoCollection(MONGO_COMPANIES_COLLECTION);
  const employeesCollection = mongoCollection(MONGO_EMPLOYEES_COLLECTION);
  if (!companiesCollection || !employeesCollection) {
    return;
  }

  await companiesCollection.createIndex({ id: 1 }, { unique: true });
  await companiesCollection.createIndex({ code: 1 }, { unique: true, sparse: true });
  await employeesCollection.createIndex({ id: 1 }, { unique: true });
  await employeesCollection.createIndex({ employeeId: 1 }, { unique: true, sparse: true });
  await employeesCollection.createIndex({ companyId: 1 });

  const remoteCompanyCount = await companiesCollection.countDocuments();
  if (remoteCompanyCount === 0) {
    const localCompanies = await all('SELECT * FROM companies ORDER BY displayName COLLATE NOCASE');
    if (localCompanies.length) {
      await companiesCollection.insertMany(localCompanies.map((company) => ({
        ...company,
        _id: company.id
      })));
    }
  }

  const remoteEmployeeCount = await employeesCollection.countDocuments();
  if (remoteEmployeeCount === 0) {
    const localEmployees = await all('SELECT * FROM employees ORDER BY name COLLATE NOCASE');
    if (localEmployees.length) {
      await employeesCollection.insertMany(localEmployees.map((employee) => ({
        ...employee,
        _id: employee.id
      })));
    }
  }
}

async function initMongoDataStore() {
  loadEnvFile();
  const mongoUri = String(process.env.MONGO_URI || '').trim();
  if (!mongoUri) {
    return false;
  }

  const candidates = await buildConnectionCandidates(mongoUri);
  let lastError = null;

  for (const candidate of candidates) {
    const nextClient = new MongoClient(candidate, {
      tls: true,
      retryWrites: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      tlsAllowInvalidCertificates: envFlag('MONGO_TLS_ALLOW_INVALID_CERTS'),
      tlsAllowInvalidHostnames: envFlag('MONGO_TLS_ALLOW_INVALID_HOSTNAMES')
    });

    try {
      await nextClient.connect();
      mongoClient = nextClient;
      mongoDb = nextClient.db(MONGO_DB_NAME);
      mongoReady = true;
      await seedMongoFromSqliteIfEmpty();
      console.log('Mongo data store connected for companies/employees.');
      return true;
    } catch (error) {
      lastError = error;
      await nextClient.close().catch(() => {});
    }
  }

  mongoReady = false;
  console.error('Mongo data store unavailable, using SQLite fallback:', lastError?.message || lastError);
  return false;
}

function init() {
  const dbPath = path.join(app.getPath('userData'), 'database.sqlite');

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('SQLite open error:', err.message);
        reject(err);
        return;
      }

      try {
        await initDatabase();
        await initMongoDataStore();
        console.log('SQLite connected:', dbPath);
        resolve();
      } catch (setupError) {
        console.error('SQLite setup error:', setupError.message);
        reject(setupError);
      }
    });
  });
}

function getCompanies() {
  const collection = mongoCollection(MONGO_COMPANIES_COLLECTION);
  if (collection) {
    return collection
      .find({})
      .sort({ displayName: 1, legalName: 1 })
      .toArray()
      .then((companies) => companies.map(stripMongoId));
  }

  return all('SELECT * FROM companies ORDER BY displayName COLLATE NOCASE');
}

function addCompany(company) {
  const collection = mongoCollection(MONGO_COMPANIES_COLLECTION);
  if (collection) {
    return nextMongoNumericId(MONGO_COMPANIES_COLLECTION).then(async (id) => {
      const now = new Date().toISOString();
      const doc = {
        ...company,
        id,
        _id: id,
        defaultPfEnabled: company.defaultPfEnabled ? 1 : 0,
        defaultPtEnabled: company.defaultPtEnabled ? 1 : 0,
        defaultPfAmount: company.defaultPfAmount || 0,
        defaultPtAmount: company.defaultPtAmount || 0,
        salaryCalculationBase: company.salaryCalculationBase || 'full-month',
        tdsRule: company.tdsRule || '',
        customFields: company.customFields || '[]',
        createdAt: now,
        updatedAt: now
      };
      await collection.insertOne(doc);
      return id;
    });
  }

  return run(
    `INSERT INTO companies (
      code, displayName, legalName, address, city, state, country, postalCode, phone,
      email, website, contactPerson, hrName, directorName, logoData, stampData,
      signatureData, cin, gstin, pan, tan, pfRegistrationNo, esicRegistrationNo,
      bankName, bankAccountNumber, ifsc, paymentMode, defaultPfEnabled, defaultPtEnabled,
      defaultPfAmount, defaultPtAmount, salaryCalculationBase, tdsRule, payslipNote, documentFooter, customFields, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )`,
    [
      company.code,
      company.displayName,
      company.legalName,
      company.address,
      company.city,
      company.state,
      company.country,
      company.postalCode,
      company.phone,
      company.email,
      company.website,
      company.contactPerson,
      company.hrName,
      company.directorName,
      company.logoData,
      company.stampData,
      company.signatureData,
      company.cin,
      company.gstin,
      company.pan,
      company.tan,
      company.pfRegistrationNo,
      company.esicRegistrationNo,
      company.bankName,
      company.bankAccountNumber,
      company.ifsc,
      company.paymentMode,
      company.defaultPfEnabled ? 1 : 0,
      company.defaultPtEnabled ? 1 : 0,
      company.defaultPfAmount || 0,
      company.defaultPtAmount || 0,
      company.salaryCalculationBase || 'full-month',
      company.tdsRule || '',
      company.payslipNote,
      company.documentFooter,
      company.customFields || '[]'
    ]
  ).then((result) => result.lastID);
}

function updateCompany(company) {
  const collection = mongoCollection(MONGO_COMPANIES_COLLECTION);
  if (collection) {
    const id = Number(company.id);
    const { _id, ...payload } = {
      ...company,
      id,
      defaultPfEnabled: company.defaultPfEnabled ? 1 : 0,
      defaultPtEnabled: company.defaultPtEnabled ? 1 : 0,
      defaultPfAmount: company.defaultPfAmount || 0,
      defaultPtAmount: company.defaultPtAmount || 0,
      salaryCalculationBase: company.salaryCalculationBase || 'full-month',
      tdsRule: company.tdsRule || '',
      customFields: company.customFields || '[]',
      updatedAt: new Date().toISOString()
    };
    return collection.updateOne({ id }, { $set: payload }, { upsert: false });
  }

  return run(
    `UPDATE companies SET
      code = ?,
      displayName = ?,
      legalName = ?,
      address = ?,
      city = ?,
      state = ?,
      country = ?,
      postalCode = ?,
      phone = ?,
      email = ?,
      website = ?,
      contactPerson = ?,
      hrName = ?,
      directorName = ?,
      logoData = ?,
      stampData = ?,
      signatureData = ?,
      cin = ?,
      gstin = ?,
      pan = ?,
      tan = ?,
      pfRegistrationNo = ?,
      esicRegistrationNo = ?,
      bankName = ?,
      bankAccountNumber = ?,
      ifsc = ?,
      paymentMode = ?,
      defaultPfEnabled = ?,
      defaultPtEnabled = ?,
      defaultPfAmount = ?,
      defaultPtAmount = ?,
      salaryCalculationBase = ?,
      tdsRule = ?,
      payslipNote = ?,
      documentFooter = ?,
      customFields = ?,
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      company.code,
      company.displayName,
      company.legalName,
      company.address,
      company.city,
      company.state,
      company.country,
      company.postalCode,
      company.phone,
      company.email,
      company.website,
      company.contactPerson,
      company.hrName,
      company.directorName,
      company.logoData,
      company.stampData,
      company.signatureData,
      company.cin,
      company.gstin,
      company.pan,
      company.tan,
      company.pfRegistrationNo,
      company.esicRegistrationNo,
      company.bankName,
      company.bankAccountNumber,
      company.ifsc,
      company.paymentMode,
      company.defaultPfEnabled ? 1 : 0,
      company.defaultPtEnabled ? 1 : 0,
      company.defaultPfAmount || 0,
      company.defaultPtAmount || 0,
      company.salaryCalculationBase || 'full-month',
      company.tdsRule || '',
      company.payslipNote,
      company.documentFooter,
      company.customFields || '[]',
      company.id
    ]
  );
}

async function deleteCompany(id) {
  const companiesCollection = mongoCollection(MONGO_COMPANIES_COLLECTION);
  const employeesCollection = mongoCollection(MONGO_EMPLOYEES_COLLECTION);
  if (companiesCollection && employeesCollection) {
    const numericId = Number(id);
    await employeesCollection.updateMany({ companyId: numericId }, { $set: { companyId: null, company: '', updatedAt: new Date().toISOString() } });
    return companiesCollection.deleteOne({ id: numericId });
  }

  await run('UPDATE employees SET companyId = NULL, company = "", updatedAt = CURRENT_TIMESTAMP WHERE companyId = ?', [id]);
  await run('UPDATE policies SET companyId = NULL, updatedAt = CURRENT_TIMESTAMP WHERE companyId = ?', [id]);
  return run('DELETE FROM companies WHERE id = ?', [id]);
}

function getPolicies() {
  return all(
    `SELECT
      policies.*,
      companies.displayName AS companyName,
      companies.code AS companyCode
    FROM policies
    LEFT JOIN companies ON companies.id = policies.companyId
    ORDER BY policies.updatedAt DESC, policies.title COLLATE NOCASE`
  );
}

function addPolicy(policy) {
  return run(
    `INSERT INTO policies (
      companyId, policyType, policyCode, title, version, effectiveDate, reviewDate,
      ownerDepartment, approverName, status, summary, purpose, scope, applicability,
      policyRules, workflow, exceptions, disciplinaryAction, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )`,
    [
      policy.companyId || null,
      policy.policyType || '',
      policy.policyCode || '',
      policy.title || '',
      policy.version || '1.0',
      policy.effectiveDate || '',
      policy.reviewDate || '',
      policy.ownerDepartment || '',
      policy.approverName || '',
      policy.status || 'Draft',
      policy.summary || '',
      policy.purpose || '',
      policy.scope || '',
      policy.applicability || '',
      policy.policyRules || '',
      policy.workflow || '',
      policy.exceptions || '',
      policy.disciplinaryAction || ''
    ]
  ).then((result) => result.lastID);
}

function updatePolicy(policy) {
  return run(
    `UPDATE policies SET
      companyId = ?,
      policyType = ?,
      policyCode = ?,
      title = ?,
      version = ?,
      effectiveDate = ?,
      reviewDate = ?,
      ownerDepartment = ?,
      approverName = ?,
      status = ?,
      summary = ?,
      purpose = ?,
      scope = ?,
      applicability = ?,
      policyRules = ?,
      workflow = ?,
      exceptions = ?,
      disciplinaryAction = ?,
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      policy.companyId || null,
      policy.policyType || '',
      policy.policyCode || '',
      policy.title || '',
      policy.version || '1.0',
      policy.effectiveDate || '',
      policy.reviewDate || '',
      policy.ownerDepartment || '',
      policy.approverName || '',
      policy.status || 'Draft',
      policy.summary || '',
      policy.purpose || '',
      policy.scope || '',
      policy.applicability || '',
      policy.policyRules || '',
      policy.workflow || '',
      policy.exceptions || '',
      policy.disciplinaryAction || '',
      policy.id
    ]
  );
}

function deletePolicy(id) {
  return run('DELETE FROM policies WHERE id = ?', [id]);
}

function getEmployees() {
  const employeesCollection = mongoCollection(MONGO_EMPLOYEES_COLLECTION);
  const companiesCollection = mongoCollection(MONGO_COMPANIES_COLLECTION);
  if (employeesCollection && companiesCollection) {
    return Promise.all([
      employeesCollection.find({}).sort({ name: 1 }).toArray(),
      companiesCollection.find({}).toArray()
    ]).then(([employees, companies]) => {
      const companyMap = new Map(companies.map((company) => [Number(company.id), company]));
      return employees.map((employeeDoc) => {
        const employee = stripMongoId(employeeDoc);
        const company = companyMap.get(Number(employee.companyId));
        return {
          ...employee,
          companyName: company?.displayName || null,
          companyLegalName: company?.legalName || null,
          companyAddress: company?.address || null,
          companyPhone: company?.phone || null,
          companyEmail: company?.email || null
        };
      });
    });
  }

  return all(
    `SELECT
      employees.*,
      companies.displayName AS companyName,
      companies.legalName AS companyLegalName,
      companies.address AS companyAddress,
      companies.phone AS companyPhone,
      companies.email AS companyEmail
    FROM employees
    LEFT JOIN companies ON companies.id = employees.companyId
    ORDER BY employees.name COLLATE NOCASE`
  );
}

async function getNextEmployeeId(companyId, excludeEmployeeRecordId = null) {
  if (!companyId) {
    return '';
  }

  const companiesCollection = mongoCollection(MONGO_COMPANIES_COLLECTION);
  const employeesCollection = mongoCollection(MONGO_EMPLOYEES_COLLECTION);
  const company = companiesCollection
    ? await companiesCollection.findOne({ id: Number(companyId) })
    : await get('SELECT code FROM companies WHERE id = ?', [companyId]);
  const prefix = buildEmployeeIdPrefix(company?.code);
  if (!prefix) {
    return '';
  }

  const employees = employeesCollection
    ? await employeesCollection.find({
        companyId: Number(companyId),
        ...(excludeEmployeeRecordId ? { id: { $ne: Number(excludeEmployeeRecordId) } } : {})
      }, { projection: { employeeId: 1 } }).toArray()
    : excludeEmployeeRecordId
      ? await all('SELECT employeeId FROM employees WHERE companyId = ? AND id != ?', [companyId, excludeEmployeeRecordId])
      : await all('SELECT employeeId FROM employees WHERE companyId = ?', [companyId]);

  const employeeIdPattern = new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`, 'i');
  let maxSequence = 0;

  employees.forEach(({ employeeId }) => {
    const match = String(employeeId || '').match(employeeIdPattern);
    if (!match) {
      return;
    }

    maxSequence = Math.max(maxSequence, Number(match[1]) || 0);
  });

  return `${prefix}${maxSequence + 1}`;
}

async function ensureEmployeeIdAvailable(employeeId, excludeEmployeeRecordId = null) {
  const normalizedEmployeeId = String(employeeId || '').trim();
  if (!normalizedEmployeeId) {
    return;
  }

  const employeesCollection = mongoCollection(MONGO_EMPLOYEES_COLLECTION);
  const existingEmployee = employeesCollection
    ? await employeesCollection.findOne({
        employeeId: { $regex: `^${escapeRegExp(normalizedEmployeeId)}$`, $options: 'i' },
        ...(excludeEmployeeRecordId ? { id: { $ne: Number(excludeEmployeeRecordId) } } : {})
      }, { projection: { id: 1 } })
    : excludeEmployeeRecordId
      ? await get(
          'SELECT id FROM employees WHERE LOWER(TRIM(employeeId)) = LOWER(TRIM(?)) AND id != ? LIMIT 1',
          [normalizedEmployeeId, excludeEmployeeRecordId]
        )
      : await get(
          'SELECT id FROM employees WHERE LOWER(TRIM(employeeId)) = LOWER(TRIM(?)) LIMIT 1',
          [normalizedEmployeeId]
        );

  if (existingEmployee) {
    throw new Error('This employee id is reserved');
  }
}

async function isEmployeeIdReserved(employeeId, excludeEmployeeRecordId = null) {
  try {
    await ensureEmployeeIdAvailable(employeeId, excludeEmployeeRecordId);
    return false;
  } catch (error) {
    if (error.message === 'This employee id is reserved') {
      return true;
    }
    throw error;
  }
}

async function addEmployee(employee) {
  const resolvedEmployeeId = employee.employeeId?.trim()
    || await getNextEmployeeId(employee.companyId);
  await ensureEmployeeIdAvailable(resolvedEmployeeId);

  const employeesCollection = mongoCollection(MONGO_EMPLOYEES_COLLECTION);
  if (employeesCollection) {
    const id = await nextMongoNumericId(MONGO_EMPLOYEES_COLLECTION);
    const now = new Date().toISOString();
    await employeesCollection.insertOne({
      ...employee,
      _id: id,
      id,
      employeeId: resolvedEmployeeId,
      companyId: employee.companyId || null,
      company: employee.company || '',
      basic: employee.basic || 0,
      hra: employee.hra || 0,
      specialAllowance: employee.specialAllowance || 0,
      pfDeductAmount: employee.pfDeductAmount || 0,
      bonus: employee.bonus || 0,
      ctc: employee.ctc || 0,
      profilePhoto: employee.profilePhoto || '',
      customFields: employee.customFields || '[]',
      createdAt: now,
      updatedAt: now
    });
    return id;
  }

  const result = await run(
    `INSERT INTO employees (
      name, employeeId, designation, department, company, companyId, doj, location,
      bankName, accountNumber, ifsc, pfNo, pfUAN, pfDeductAmount, esiNo, pan, basic, hra,
      specialAllowance, mobileNumber, email, address, aadhaar, employmentType,
      reportingManager, bonus, ctc, emergencyContact, profilePhoto, customFields, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )`,
    [
      employee.name,
      resolvedEmployeeId,
      employee.designation,
      employee.department,
      employee.company || '',
      employee.companyId || null,
      employee.doj,
      employee.location,
      employee.bankName,
      employee.accountNumber,
      employee.ifsc,
      employee.pfNo,
      employee.pfUAN,
      employee.pfDeductAmount || 0,
      employee.esiNo,
      employee.pan,
      employee.basic || 0,
      employee.hra || 0,
      employee.specialAllowance || 0,
      employee.mobileNumber,
      employee.email,
      employee.address,
      employee.aadhaar,
      employee.employmentType,
      employee.reportingManager,
      employee.bonus || 0,
      employee.ctc || 0,
      employee.emergencyContact,
      employee.profilePhoto || '',
      employee.customFields || '[]'
    ]
  );

  return result.lastID;
}

async function updateEmployee(employee) {
  const resolvedEmployeeId = employee.employeeId?.trim()
    || await getNextEmployeeId(employee.companyId, employee.id);
  await ensureEmployeeIdAvailable(resolvedEmployeeId, employee.id);

  const employeesCollection = mongoCollection(MONGO_EMPLOYEES_COLLECTION);
  if (employeesCollection) {
    const id = Number(employee.id);
    const { _id, ...payload } = {
      ...employee,
      id,
      employeeId: resolvedEmployeeId,
      companyId: employee.companyId || null,
      company: employee.company || '',
      basic: employee.basic || 0,
      hra: employee.hra || 0,
      specialAllowance: employee.specialAllowance || 0,
      pfDeductAmount: employee.pfDeductAmount || 0,
      bonus: employee.bonus || 0,
      ctc: employee.ctc || 0,
      profilePhoto: employee.profilePhoto || '',
      customFields: employee.customFields || '[]',
      updatedAt: new Date().toISOString()
    };
    return employeesCollection.updateOne({ id }, { $set: payload }, { upsert: false });
  }

  return run(
    `UPDATE employees SET
      name = ?,
      employeeId = ?,
      designation = ?,
      department = ?,
      company = ?,
      companyId = ?,
      doj = ?,
      location = ?,
      bankName = ?,
      accountNumber = ?,
      ifsc = ?,
      pfNo = ?,
      pfUAN = ?,
      pfDeductAmount = ?,
      esiNo = ?,
      pan = ?,
      basic = ?,
      hra = ?,
      specialAllowance = ?,
      mobileNumber = ?,
      email = ?,
      address = ?,
      aadhaar = ?,
      employmentType = ?,
      reportingManager = ?,
      bonus = ?,
      ctc = ?,
      emergencyContact = ?,
      profilePhoto = ?,
      customFields = ?,
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      employee.name,
      resolvedEmployeeId,
      employee.designation,
      employee.department,
      employee.company || '',
      employee.companyId || null,
      employee.doj,
      employee.location,
      employee.bankName,
      employee.accountNumber,
      employee.ifsc,
      employee.pfNo,
      employee.pfUAN,
      employee.pfDeductAmount || 0,
      employee.esiNo,
      employee.pan,
      employee.basic || 0,
      employee.hra || 0,
      employee.specialAllowance || 0,
      employee.mobileNumber,
      employee.email,
      employee.address,
      employee.aadhaar,
      employee.employmentType,
      employee.reportingManager,
      employee.bonus || 0,
      employee.ctc || 0,
      employee.emergencyContact,
      employee.profilePhoto || '',
      employee.customFields || '[]',
      employee.id
    ]
  );
}

function deleteEmployee(id) {
  const employeesCollection = mongoCollection(MONGO_EMPLOYEES_COLLECTION);
  if (employeesCollection) {
    return employeesCollection.deleteOne({ id: Number(id) });
  }

  return run('DELETE FROM employees WHERE id = ?', [id]);
}

module.exports = {
  init,
  getCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
  getPolicies,
  addPolicy,
  updatePolicy,
  deletePolicy,
  getEmployees,
  getNextEmployeeId,
  isEmployeeIdReserved,
  addEmployee,
  updateEmployee,
  deleteEmployee
};
