const { sql, dbConfig } = require('./database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  let pool;
  try {
    // Connect without specific database first to create it
    const masterConfig = { ...dbConfig, database: 'master' };
    pool = await sql.connect(masterConfig);

    // Create database if not exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${dbConfig.database}')
      BEGIN
        CREATE DATABASE [${dbConfig.database}]
        PRINT 'Database created: ${dbConfig.database}'
      END
    `);
    console.log(`✅ Database '${dbConfig.database}' ready`);

    await pool.close();

    // Reconnect to the target database
    pool = await sql.connect(dbConfig);

    // === TABLES ===

    // Membership Plans
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MembershipPlans')
      CREATE TABLE MembershipPlans (
        PlanID        INT IDENTITY(1,1) PRIMARY KEY,
        PlanName      NVARCHAR(100) NOT NULL,
        Description   NVARCHAR(500),
        DurationDays  INT NOT NULL,
        Price         DECIMAL(10,2) NOT NULL,
        Features      NVARCHAR(MAX),
        IsActive      BIT DEFAULT 1,
        CreatedAt     DATETIME2 DEFAULT GETDATE(),
        UpdatedAt     DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Members
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Members')
      CREATE TABLE Members (
        MemberID        INT IDENTITY(1,1) PRIMARY KEY,
        MemberCode      NVARCHAR(20) UNIQUE NOT NULL,
        FirstName       NVARCHAR(100) NOT NULL,
        LastName        NVARCHAR(100) NOT NULL,
        Email           NVARCHAR(255) UNIQUE,
        Phone           NVARCHAR(20),
        DateOfBirth     DATE,
        Gender          NVARCHAR(10),
        Address         NVARCHAR(500),
        EmergencyContact NVARCHAR(200),
        PhotoPath       NVARCHAR(500),
        FaceDescriptor  NVARCHAR(MAX),
        IsActive        BIT DEFAULT 1,
        Notes           NVARCHAR(1000),
        CreatedAt       DATETIME2 DEFAULT GETDATE(),
        UpdatedAt       DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Payments
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Payments')
      CREATE TABLE Payments (
        PaymentID     INT IDENTITY(1,1) PRIMARY KEY,
        MemberID      INT NOT NULL FOREIGN KEY REFERENCES Members(MemberID),
        PlanID        INT NOT NULL FOREIGN KEY REFERENCES MembershipPlans(PlanID),
        Amount        DECIMAL(10,2) NOT NULL,
        PaymentDate   DATETIME2 DEFAULT GETDATE(),
        PaymentMethod NVARCHAR(50) DEFAULT 'Cash',
        StartDate     DATE NOT NULL,
        EndDate       DATE NOT NULL,
        Status        NVARCHAR(20) DEFAULT 'Active',
        TransactionRef NVARCHAR(100),
        Notes         NVARCHAR(500),
        RecordedBy    INT,
        CreatedAt     DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Memberships (active membership view)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Memberships')
      CREATE TABLE Memberships (
        MembershipID  INT IDENTITY(1,1) PRIMARY KEY,
        MemberID      INT NOT NULL FOREIGN KEY REFERENCES Members(MemberID),
        PlanID        INT NOT NULL FOREIGN KEY REFERENCES MembershipPlans(PlanID),
        PaymentID     INT FOREIGN KEY REFERENCES Payments(PaymentID),
        StartDate     DATE NOT NULL,
        EndDate       DATE NOT NULL,
        Status        NVARCHAR(20) DEFAULT 'Active',
        CreatedAt     DATETIME2 DEFAULT GETDATE(),
        UpdatedAt     DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Entry Logs
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EntryLogs')
      CREATE TABLE EntryLogs (
        LogID         INT IDENTITY(1,1) PRIMARY KEY,
        MemberID      INT FOREIGN KEY REFERENCES Members(MemberID),
        EntryTime     DATETIME2 DEFAULT GETDATE(),
        ExitTime      DATETIME2,
        DetectionMethod NVARCHAR(50) DEFAULT 'Face',
        ConfidenceScore DECIMAL(5,4),
        Status        NVARCHAR(20) DEFAULT 'Entry',
        Notes         NVARCHAR(500),
        IPAddress     NVARCHAR(50),
        StationID     NVARCHAR(50) DEFAULT 'Main'
      )
    `);

    // Admin Users
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdminUsers')
      CREATE TABLE AdminUsers (
        AdminID       INT IDENTITY(1,1) PRIMARY KEY,
        Username      NVARCHAR(100) UNIQUE NOT NULL,
        PasswordHash  NVARCHAR(255) NOT NULL,
        FullName      NVARCHAR(200),
        Email         NVARCHAR(255),
        Role          NVARCHAR(50) DEFAULT 'Staff',
        IsActive      BIT DEFAULT 1,
        LastLogin     DATETIME2,
        CreatedAt     DATETIME2 DEFAULT GETDATE()
      )
    `);

    console.log('✅ All tables created/verified');

    // === SEED DATA ===

    // Default admin
    const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
    await pool.request()
      .input('username', sql.NVarChar, process.env.ADMIN_USERNAME || 'admin')
      .input('hash', sql.NVarChar, adminHash)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM AdminUsers WHERE Username = @username)
        INSERT INTO AdminUsers (Username, PasswordHash, FullName, Email, Role)
        VALUES (@username, @hash, 'System Administrator', 'admin@gym.com', 'Admin')
      `);

    // Default membership plans
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM MembershipPlans)
      BEGIN
        INSERT INTO MembershipPlans (PlanName, Description, DurationDays, Price, Features) VALUES
        ('Daily Pass',    '1-day access',         1,   150.00, 'Full gym access'),
        ('Weekly Plan',   '7-day membership',     7,   800.00, 'Full gym access,Locker'),
        ('Monthly Basic', '30-day membership',    30,  2500.00,'Full gym access,Locker,Towel service'),
        ('Monthly Plus',  '30-day premium',       30,  4000.00,'Full gym access,Locker,Towel service,Personal trainer 2x'),
        ('Quarterly',     '90-day membership',    90,  7000.00,'Full gym access,Locker,Towel service,Personal trainer 4x'),
        ('Annual',        '365-day membership',   365, 25000.00,'Full gym access,Locker,Towel service,Unlimited PT,Nutrition plan')
      END
    `);

    console.log('✅ Seed data inserted');
    console.log('\n🎉 Database setup complete!');
    console.log(`   Admin login → username: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`               password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);

  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

setupDatabase();
