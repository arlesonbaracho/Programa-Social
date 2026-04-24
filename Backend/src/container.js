const { createHealthService } = require("./services/health.service");
const { createCitizenRepository } = require("./repositories/citizen.repository");
const { createCitizenService } = require("./services/citizen.service");
const { createUserRepository } = require("./repositories/user.repository");
const { createSessionRepository } = require("./repositories/session.repository");
const { createProgramRepository } = require("./repositories/program.repository");
const { createCriteriaRepository } = require("./repositories/criteria.repository");
const { createEnrollmentRepository } = require("./repositories/enrollment.repository");
const { createNotificationRepository } = require("./repositories/notification.repository");
const { createDocumentRepository } = require("./repositories/document.repository");
const { createEmailProvider } = require("./providers/email.provider");
const { createWebhookProvider } = require("./providers/webhook.provider");
const { createAuthService } = require("./services/auth.service");
const { createProgramService } = require("./services/program.service");
const { createEnrollmentService } = require("./services/enrollment.service");
const { createUserService } = require("./services/user.service");
const { createNotificationService } = require("./services/notification.service");
const { createDocumentService } = require("./services/document.service");

function buildDependencies({ env, database }) {
  const healthService = createHealthService({
    appName: env.appName,
    envName: env.nodeEnv,
    database,
  });

  const citizenRepository = createCitizenRepository({ db: database });
  const citizenService = createCitizenService({ citizenRepository });
  const userRepository = createUserRepository({ db: database });
  const sessionRepository = createSessionRepository({ db: database });
  const programRepository = createProgramRepository({ db: database });
  const criteriaRepository = createCriteriaRepository({ db: database });
  const enrollmentRepository = createEnrollmentRepository({ db: database });
  const notificationRepository = createNotificationRepository({ db: database });
  const documentRepository = createDocumentRepository({ db: database });
  const emailProvider = createEmailProvider(env.email);
  const webhookProvider = createWebhookProvider(env.webhook);

  const authService = createAuthService({
    userRepository,
    sessionRepository,
    jwtSecret: env.jwtSecret,
    jwtRefreshSecret: env.jwtRefreshSecret,
    jwtExpiration: env.jwtExpiration,
    jwtRefreshExpiration: env.jwtRefreshExpiration,
    bcryptRounds: env.bcryptRounds,
  });

  const programService = createProgramService({
    database,
    programRepository,
    criteriaRepository,
    enrollmentRepository,
  });

  const userService = createUserService({ userRepository });
  const notificationService = createNotificationService({
    notificationRepository,
    userRepository,
    programRepository,
    enrollmentRepository,
    emailProvider,
    webhookProvider,
  });
  const enrollmentService = createEnrollmentService({
    database,
    programRepository,
    criteriaRepository,
    enrollmentRepository,
    notificationService,
    userRepository,
  });
  const documentService = createDocumentService({ documentRepository });

  return {
    healthService,
    citizenService,
    authService,
    programService,
    enrollmentService,
    userService,
    notificationService,
    documentService,
  };
}

module.exports = { buildDependencies };
