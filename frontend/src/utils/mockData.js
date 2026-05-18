// Demo mode mock data — used when backend is unreachable (GitHub Pages)

export const DEMO_TOKEN = 'demo-token-irongate-2026';
export const DEMO_ADMIN = { AdminID: 1, Username: 'admin', FullName: 'System Administrator', Role: 'Admin' };

const today = new Date();
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString(); };
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

export const PLANS = [
  { PlanID: 1, PlanName: 'Daily Pass',    Description: '1-day access',       DurationDays: 1,   Price: 150,   Features: 'Full gym access',                                              IsActive: true },
  { PlanID: 2, PlanName: 'Weekly Plan',   Description: '7-day membership',   DurationDays: 7,   Price: 800,   Features: 'Full gym access,Locker',                                       IsActive: true },
  { PlanID: 3, PlanName: 'Monthly Basic', Description: '30-day membership',  DurationDays: 30,  Price: 2500,  Features: 'Full gym access,Locker,Towel service',                         IsActive: true },
  { PlanID: 4, PlanName: 'Monthly Plus',  Description: '30-day premium',     DurationDays: 30,  Price: 4000,  Features: 'Full gym access,Locker,Towel service,Personal trainer 2x',     IsActive: true },
  { PlanID: 5, PlanName: 'Quarterly',     Description: '90-day membership',  DurationDays: 90,  Price: 7000,  Features: 'Full gym access,Locker,Towel service,Personal trainer 4x',     IsActive: true },
  { PlanID: 6, PlanName: 'Annual',        Description: '365-day membership', DurationDays: 365, Price: 25000, Features: 'Full gym access,Locker,Towel service,Unlimited PT,Nutrition plan', IsActive: true },
];

const memberBase = [
  { MemberID: 1,  MemberCode: 'GYM2623908', FirstName: 'Nidhin',   LastName: 'Babu',     Email: 'nidhinbabu@gmail.com',        Phone: '+919645950000', Gender: 'Male',   PlanID: 3, startOff: 10 },
  { MemberID: 2,  MemberCode: 'GYM2624596', FirstName: 'Arjun',    LastName: 'Sharma',   Email: 'arjun.sharma@gmail.com',      Phone: '+919876543210', Gender: 'Male',   PlanID: 3, startOff: 18 },
  { MemberID: 3,  MemberCode: 'GYM2631122', FirstName: 'Priya',    LastName: 'Nair',     Email: 'priya.nair@gmail.com',        Phone: '+919845123456', Gender: 'Female', PlanID: 4, startOff: 5  },
  { MemberID: 4,  MemberCode: 'GYM2638874', FirstName: 'Rahul',    LastName: 'Verma',    Email: 'rahul.verma@outlook.com',     Phone: '+919731234567', Gender: 'Male',   PlanID: 5, startOff: 30 },
  { MemberID: 5,  MemberCode: 'GYM2641233', FirstName: 'Anjali',   LastName: 'Mehta',    Email: 'anjali.mehta@gmail.com',      Phone: '+919654321098', Gender: 'Female', PlanID: 3, startOff: 8  },
  { MemberID: 6,  MemberCode: 'GYM2645511', FirstName: 'Vikram',   LastName: 'Singh',    Email: 'vikram.singh@yahoo.com',      Phone: '+919567890123', Gender: 'Male',   PlanID: 6, startOff: 60 },
  { MemberID: 7,  MemberCode: 'GYM2683540', FirstName: 'Deepika',  LastName: 'Reddy',    Email: 'deepika.reddy@gmail.com',     Phone: '+919480123456', Gender: 'Female', PlanID: 3, startOff: 35 },
  { MemberID: 8,  MemberCode: 'GYM2652522', FirstName: 'Karthik',  LastName: 'Iyer',     Email: 'karthik.iyer@gmail.com',      Phone: '+919393939393', Gender: 'Male',   PlanID: 4, startOff: 18 },
  { MemberID: 9,  MemberCode: 'GYM2685480', FirstName: 'Sneha',    LastName: 'Pillai',   Email: 'sneha.pillai@hotmail.com',    Phone: '+919282828282', Gender: 'Female', PlanID: 2, startOff: 40 },
  { MemberID: 10, MemberCode: 'GYM2646124', FirstName: 'Rohit',    LastName: 'Gupta',    Email: 'rohit.gupta@gmail.com',       Phone: '+919171717171', Gender: 'Male',   PlanID: 5, startOff: 6  },
  { MemberID: 11, MemberCode: 'GYM2644819', FirstName: 'Meera',    LastName: 'Krishnan', Email: 'meera.krishnan@gmail.com',    Phone: '+919060606060', Gender: 'Female', PlanID: 3, startOff: 12 },
  { MemberID: 12, MemberCode: 'GYM2622673', FirstName: 'Aditya',   LastName: 'Patel',    Email: 'aditya.patel@gmail.com',      Phone: '+918950505050', Gender: 'Male',   PlanID: 4, startOff: 44 },
  { MemberID: 13, MemberCode: 'GYM2611464', FirstName: 'Kavya',    LastName: 'Menon',    Email: 'kavya.menon@gmail.com',       Phone: '+918840404040', Gender: 'Female', PlanID: 3, startOff: 43 },
  { MemberID: 14, MemberCode: 'GYM2655033', FirstName: 'Suresh',   LastName: 'Kumar',    Email: 'suresh.kumar@rediffmail.com', Phone: '+918730303030', Gender: 'Male',   PlanID: 6, startOff: 18 },
  { MemberID: 15, MemberCode: 'GYM2658195', FirstName: 'Lakshmi',  LastName: 'Bhat',     Email: 'lakshmi.bhat@gmail.com',      Phone: '+918620202020', Gender: 'Female', PlanID: 4, startOff: 50 },
  { MemberID: 16, MemberCode: 'GYM2671391', FirstName: 'Varun',    LastName: 'Nambiar',  Email: 'varun.nambiar@gmail.com',     Phone: '+918510101010', Gender: 'Male',   PlanID: 3, startOff: 16 },
];

const methods = ['Cash', 'UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Debit Card'];

export const MEMBERS = memberBase.map((m, i) => {
  const plan = PLANS.find(p => p.PlanID === m.PlanID);
  const startDate = daysAgo(m.startOff).split('T')[0];
  const endDate = addDays(startDate, plan.DurationDays);
  const isExpired = new Date(endDate) < today;
  return {
    ...m,
    IsActive: 1,
    PhotoPath: null,
    FaceDescriptor: null,
    CreatedAt: daysAgo(m.startOff + 2),
    MembershipExpiry: endDate,
    MembershipStatus: isExpired ? 'Expired' : 'Active',
    HasActiveMembership: isExpired ? 0 : 1,
    PlanName: plan.PlanName,
  };
});

export const PAYMENTS = memberBase.map((m, i) => {
  const plan = PLANS.find(p => p.PlanID === m.PlanID);
  const startDate = daysAgo(m.startOff).split('T')[0];
  const endDate = addDays(startDate, plan.DurationDays);
  return {
    PaymentID: i + 1,
    MemberID: m.MemberID,
    MemberName: `${m.FirstName} ${m.LastName}`,
    MemberCode: m.MemberCode,
    PlanID: m.PlanID,
    PlanName: plan.PlanName,
    Amount: plan.Price,
    PaymentMethod: methods[i % methods.length],
    StartDate: startDate,
    EndDate: endDate,
    Status: 'Active',
    PaymentDate: daysAgo(m.startOff),
  };
});

const entryTimes = [2, 1, 3, 0, 4, 1, 2, 0, 5, 1, 3, 2, 0, 1, 4, 0];
export const ENTRY_LOGS = memberBase.flatMap((m, mi) =>
  Array.from({ length: 4 + (mi % 4) }, (_, i) => ({
    LogID: mi * 10 + i + 1,
    MemberID: m.MemberID,
    MemberName: `${m.FirstName} ${m.LastName}`,
    MemberCode: m.MemberCode,
    EntryTime: daysAgo(entryTimes[mi] + i),
    ExitTime: null,
    DetectionMethod: 'Face',
    ConfidenceScore: (0.87 + (i * 0.03) % 0.12).toFixed(4),
    Status: 'Entry',
    StationID: 'Main',
  }))
);

export const DASHBOARD_STATS = {
  stats: {
    totalActiveMembers: 16,
    activeMemberships: 9,
    currentlyInside: 1,
    todayEntries: 3,
    todayRevenue: 98300,
    monthRevenue: 98300,
    expiringThisWeek: 1,
    expiredToday: 7,
  },
  recentEntries: ENTRY_LOGS.slice(0, 7).map(e => ({
    MemberName: e.MemberName,
    EntryTime: e.EntryTime,
    Status: e.Status,
  })),
  weeklyData: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => ({
    Date: daysAgo(6 - i).split('T')[0],
    Entries: [4, 7, 5, 8, 6, 3, 3][i],
  })),
};
