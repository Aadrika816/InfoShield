-- ============================================================================
-- InfoShield - AI-Powered Detection of Fake Government Schemes
-- Database Schema for MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `infoshield_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `infoshield_db`;

-- 1. USERS TABLE (Citizen, Analyst, Administrator)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('citizen', 'analyst', 'admin') DEFAULT 'citizen',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_login` TIMESTAMP NULL,
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. VERIFICATION SCANS LOG TABLE
CREATE TABLE IF NOT EXISTS `scans` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `input_type` ENUM('message', 'url', 'ocr', 'whatsapp_bot') NOT NULL DEFAULT 'message',
    `raw_input` TEXT NOT NULL,
    `verdict` ENUM('POTENTIALLY_FAKE', 'LIKELY_GENUINE', 'NEEDS_VERIFICATION') NOT NULL,
    `verdict_title` VARCHAR(255) NOT NULL,
    `risk_score` INT NOT NULL,
    `category_detected` VARCHAR(100) NULL,
    `primary_trigger` TEXT NULL,
    `red_flags_json` TEXT NULL,
    `matched_scheme_id` VARCHAR(100) NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_scans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_scans_verdict` (`verdict`),
    INDEX `idx_scans_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CITIZEN FRAUD & SCAM INCIDENT REPORTS (Integrated with Cyber Crime 1930)
CREATE TABLE IF NOT EXISTS `scam_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `reporter_name` VARCHAR(100) NOT NULL,
    `reporter_contact` VARCHAR(100) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `scam_title` VARCHAR(255) NOT NULL,
    `claimed_amount` VARCHAR(100) NULL,
    `demanded_fee` VARCHAR(100) NULL,
    `suspicious_url` VARCHAR(255) NULL,
    `suspicious_phone` VARCHAR(50) NULL,
    `evidence_text` TEXT NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED_SCAM', 'REJECTED', 'FORWARDED_TO_1930') DEFAULT 'PENDING',
    `cyber_ack_number` VARCHAR(100) UNIQUE NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_reports_status` (`status`),
    INDEX `idx_reports_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. OFFICIAL VERIFIED GOVERNMENT SCHEMES DIRECTORY
CREATE TABLE IF NOT EXISTS `official_schemes` (
    `id` VARCHAR(100) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `short_name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `ministry` VARCHAR(255) NOT NULL,
    `official_domain` VARCHAR(255) NOT NULL,
    `official_url` VARCHAR(500) NOT NULL,
    `fee_required` BOOLEAN DEFAULT FALSE,
    `official_fee` VARCHAR(100) DEFAULT '₹0 (Completely Free)',
    `max_benefit_numeric` DECIMAL(12,2) DEFAULT 0,
    `benefit_summary` TEXT NOT NULL,
    `target_audience` TEXT NOT NULL,
    `keywords_json` TEXT NOT NULL,
    `verified_notice` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_schemes_cat` (`category`),
    INDEX `idx_schemes_domain` (`official_domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PIB FACT CHECK DEBUNKED SCAMS REPOSITORY
CREATE TABLE IF NOT EXISTS `pib_fact_checks` (
    `id` VARCHAR(100) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `scam_type` VARCHAR(100) NOT NULL,
    `pib_verdict` VARCHAR(100) NOT NULL,
    `pib_summary` TEXT NOT NULL,
    `ref_url` VARCHAR(500) NOT NULL,
    `debunk_proof` TEXT NOT NULL,
    `keywords_json` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_pib_type` (`scam_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CITIZEN FEEDBACK & AUDIT COMMENTS
CREATE TABLE IF NOT EXISTS `feedback` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `rating` INT DEFAULT 5,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INITIAL SEED DATA FOR OFFICIAL SCHEMES
-- ============================================================================

INSERT IGNORE INTO `official_schemes` 
(`id`, `name`, `short_name`, `category`, `ministry`, `official_domain`, `official_url`, `fee_required`, `official_fee`, `max_benefit_numeric`, `benefit_summary`, `target_audience`, `keywords_json`, `verified_notice`)
VALUES
('pm-kisan', 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)', 'PM-KISAN', 'Agriculture & Farmers', 'Ministry of Agriculture and Farmers Welfare', 'pmkisan.gov.in', 'https://pmkisan.gov.in', FALSE, '₹0 (Completely Free)', 6000.00, '₹6,000 per year in 3 equal installments of ₹2,000 directly via DBT into bank accounts.', 'Small and marginal farmer families with cultivable landholding.', '["pm kisan", "pmkisan", "kisan samman nidhi", "farmer installment", "kist", "17th installment", "18th installment", "pm-kisan", "pm kishan", "dbt status", "kisan nidhi"]', 'Government NEVER charges registration or processing fees for PM-KISAN. Applications are made through official portal or CSC centers. Any claim of ₹15,000 or ₹25,000 bonus is fraudulent.'),
('pm-jay', 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY & ABHA)', 'Ayushman Bharat (PM-JAY)', 'Healthcare', 'National Health Authority (Ministry of Health and Family Welfare)', 'nha.gov.in', 'https://beneficiary.nha.gov.in', FALSE, '₹0 (Completely Free)', 500000.00, 'Free secondary and tertiary healthcare hospitalization cover of up to ₹5,00,000 per family per year, plus ABHA Digital Health Account.', 'Bottom 40% economically vulnerable population and all eligible Indian citizens for ABHA ID.', '["ayushman bharat", "pmjay", "pm-jay", "ayushman card", "golden card", "health cover 5 lakh", "abha", "national health authority", "nha", "beneficiary.nha.gov.in", "free treatment card"]', 'Ayushman Golden Card & ABHA ID creation is completely FREE OF COST. Beware of fake download links and ₹250-₹450 fee demands.'),
('pmay-urban', 'Pradhan Mantri Awas Yojana - Urban (PMAY-U)', 'PMAY-Urban', 'Housing & Shelter', 'Ministry of Housing and Urban Affairs (MoHUA)', 'pmaymis.gov.in', 'https://pmaymis.gov.in', FALSE, '₹0 (Completely Free)', 267000.00, 'Credit-linked interest subsidy up to ₹2.67 Lakhs for constructing or buying a pucca house in urban areas.', 'Economically Weaker Section (EWS), Low Income Group (LIG) and Middle Income Groups (MIG).', '["pmay", "awas yojana", "pm awas", "pradhan mantri awas yojana", "housing scheme", "pm housing", "pmay-u", "urban housing"]', 'PMAY allotment is strictly through official municipal corporations and transparent SECC lists. No agent can issue allotment letters for ₹1,500 file charges.'),
('pm-mudra', 'Pradhan Mantri MUDRA Yojana (PMMY)', 'PM Mudra Yojana', 'Financial Support & Loans', 'Department of Financial Services, Ministry of Finance', 'mudra.org.in', 'https://www.mudra.org.in', FALSE, '₹0 (No Upfront Commission)', 2000000.00, 'Collateral-free business loans up to ₹20 Lakhs across Shishu (up to ₹50k), Kishore (₹50k-₹5L) and Tarun (₹5L-₹20L) categories.', 'Non-corporate, non-farm small and micro enterprises, retail vendors, and artisans.', '["mudra loan", "pm mudra", "shishu loan", "kishore loan", "tarun loan", "collateral free loan", "mudra yojana", "business loan 10 lakh", "stamp duty"]', 'Government of India and MUDRA NEVER issue loan approval letters demanding stamp duty, file processing fees, or GST payments via UPI/WhatsApp. Loans are sanctioned only via verified commercial banks and NBFCs.'),
('pm-surya-ghar', 'PM Surya Ghar: Muft Bijli Yojana', 'PM Surya Ghar', 'Energy & Solar', 'Ministry of New and Renewable Energy (MNRE)', 'pmsuryaghar.gov.in', 'https://pmsuryaghar.gov.in', FALSE, '₹0 (Direct Subsidy)', 78000.00, 'Direct capital subsidy of up to ₹78,000 for installing 3kW rooftop solar panels, providing up to 300 units of free electricity monthly.', 'Residential households across all Indian states and Union Territories.', '["pm surya ghar", "muft bijli", "solar rooftop", "free electricity", "solar subsidy", "rooftop solar", "pmsuryaghar", "surya ghar"]', 'Rooftop solar applications are ONLY processed on pmsuryaghar.gov.in. Beware of fake contractors demanding cash deposits before portal registration.'),
('sukanya-samriddhi', 'Sukanya Samriddhi Yojana (SSY)', 'Sukanya Samriddhi (SSY)', 'Women & Child', 'Ministry of Finance & Department of Posts', 'indiapost.gov.in', 'https://www.indiapost.gov.in', FALSE, '₹0 (Completely Free Account Opening)', 150000.00, 'High-interest tax-free small savings scheme (8.2% p.a.) for the girl child under Beti Bachao Beti Padhao campaign.', 'Parents or legal guardians of a girl child aged below 10 years.', '["sukanya samriddhi", "ssy", "girl child savings", "sukanya yojana", "beti bachao", "post office sukanya"]', 'SSY accounts can ONLY be opened at authorized Post Offices or commercial bank branches. There is NO online instant cash grant or bonus payout under this scheme.'),
('nsp-scholarships', 'National Scholarship Portal (NSP)', 'National Scholarship Portal', 'Education & Students', 'Ministry of Electronics and Information Technology (MeitY)', 'scholarships.gov.in', 'https://scholarships.gov.in', FALSE, '₹0 (Completely Free)', 50000.00, 'Unified portal for Pre-Matric, Post-Matric, and Merit-cum-Means scholarships across Central and State ministries.', 'Students from SC, ST, OBC, minority communities, and economically weaker sections.', '["nsp", "national scholarship portal", "pre matric scholarship", "post matric scholarship", "student stipend", "scholarships.gov.in", "free laptop", "free tablet"]', 'Scholarship applications and biometric authentications are 100% free on scholarships.gov.in. Do not pay any private cyber café agent for "guaranteed scholarship approval".');

-- ============================================================================
-- INITIAL SEED DATA FOR PIB FACT CHECK DEBUNKS
-- ============================================================================

INSERT IGNORE INTO `pib_fact_checks`
(`id`, `title`, `scam_type`, `pib_verdict`, `pib_summary`, `ref_url`, `debunk_proof`, `keywords_json`)
VALUES
('pib-laptop-2024', 'Fake PM Free Laptop Scheme 2024 demanding ₹250–₹299 registration fee', 'Financial & Data Theft', 'FAKE / FRAUD', 'PIB Fact Check confirmed that the Central Government is NOT running any Free Laptop Scheme requiring citizens to pay online registration charges or share on WhatsApp.', 'https://factcheck.pib.gov.in', 'Government never charges money for student benefits. Genuine student hardware programs are announced only on education.gov.in or scholarships.gov.in.', '["free laptop", "laptop yojana", "laptop scheme", "free hp laptop", "50000 laptop", "pm-laptop-yojana"]'),
('pib-electricity-bill', 'Fake Electricity Bill Disconnection Warning on WhatsApp', 'Cyber Phishing & Remote Access Scam', 'FAKE / FRAUD', 'Fraudsters send WhatsApp SMS stating "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Please call officer immediately."', 'https://factcheck.pib.gov.in', 'Power distribution companies never ask customers to call personal mobile numbers or download QuickSupport / AnyDesk APKs to pay bills.', '["electricity will be disconnected", "power will be disconnected", "electricity officer", "bijli bill", "bill was not updated", "disconnected tonight"]'),
('pib-ayushman-card', 'Fake Ayushman Bharat Golden Card download fee ₹450 & Aadhaar OTP harvest', 'Healthcare Identity & Cyber Fraud', 'FAKE / FRAUD', 'A fake website and WhatsApp forward offers home delivery of "VIP Ayushman Golden Card" for ₹450. National Health Authority (NHA) confirmed that Ayushman Card creation is 100% FREE.', 'https://factcheck.pib.gov.in', 'Ayushman Bharat cards are issued free of cost at government hospitals and verified CSCs. Government never charges registration fees or requests OTP via private links.', '["ayushman golden card", "vip golden card", "ayushman card free", "treatment card delivered", "ayushman card 450", "ayushman-card-free", "ayushman-card"]'),
('pib-sbi-yono', 'Fake SBI YONO Account Suspension & Security APK Download Scam', 'Banking Phishing & Remote Trojan APK', 'FAKE / BANKING FRAUD', 'Fraudulent SMS claiming SBI Net Banking / YONO account is suspended and urging users to download an APK file from third-party links to update PAN/KYC.', 'https://factcheck.pib.gov.in', 'Banks never send APK download links or demand reactivation charges via SMS. Always use official Google Play Store or sbi.co.in.', '["sbi yono", "account has been suspended", "sbi-kyc-verify", "pending kyc verification", "sbi.apk", "reactivation fee"]'),
('pib-mudra-loan', 'Fake Mudra Loan ₹10 Lakh Approval Letter Demanding ₹1,250 Stamp Fee', 'Loan Advance-Fee Fraud', 'FAKE / FRAUD', 'Fraudsters circulate forged approval letters carrying Ministry of Finance letterhead claiming a ₹10,00,000 Mudra loan has been approved and demanding ₹1,250 stamp duty or registration fee.', 'https://factcheck.pib.gov.in', 'PMMY loans are never sanctioned via social media or email approval letters. No upfront fee or stamp duty is ever charged via UPI.', '["mudra approval", "stamp duty fee", "1250 stamp fee", "mudra loan letter", "mudra approval letter"]');
