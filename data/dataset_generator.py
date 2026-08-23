import os
import json
import random
import pandas as pd
from typing import List, Dict

# Set random seed for reproducibility
random.seed(42)

DOMAIN_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "domain_config.json")
OUTPUT_CSV_PATH = os.path.join(os.path.dirname(__file__), "domain_dataset.csv")

# Rich legal clause templates per domain to generate realistic multi-paragraph contracts
LEGAL_PREAMBLES = [
    "THIS AGREEMENT (the \"Agreement\") is entered into as of {date}, by and between {party_a} (\"First Party\") and {party_b} (\"Second Party\"). WHEREAS, the parties desire to establish the formal legal terms governing their relationship as set forth herein.",
    "THIS CONTRACT is made effective as of {date}, by and among {party_a}, having its principal place of business at {address_a}, and {party_b}, residing at or having offices at {address_b}. WITNESSETH, that for good and valuable consideration, the parties agree as follows:",
    "MEMORANDUM OF AGREEMENT dated {date}, between {party_a} (hereinafter referred to as \"Company\") and {party_b} (hereinafter referred to as \"Counterparty\"). NOW THEREFORE, in consideration of the mutual covenants contained herein, the parties hereby agree as follows:"
]

LEGAL_BOILERPLATE = [
    "\n\nGOVERNING LAW AND JURISDICTION\nThis Agreement shall be governed by, construed, and enforced in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles. Any legal action or proceeding arising under this Agreement shall be brought exclusively in the state or federal courts located in Wilmington, Delaware.",
    "\n\nINDEMNIFICATION AND LIMITATION OF LIABILITY\nEach party agrees to defend, indemnify, and hold harmless the other party, its officers, directors, employees, and agents from and against any third-party claims, liabilities, damages, losses, or expenses arising out of any material breach of this Agreement. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.",
    "\n\nMISCELLANEOUS PROVISIONS\nThis Agreement constitutes the entire understanding between the parties regarding the subject matter hereof and supersedes all prior agreements or communications. No amendment or modification shall be binding unless executed in writing by authorized representatives of both parties. If any provision is held invalid, the remainder shall continue in full force."
]

SIGNATURE_BLOCK = "\n\nIN WITNESS WHEREOF, the parties hereto have executed this Agreement by their duly authorized representatives as of the date first above written.\n\nBy: _______________________\nTitle: Authorized Signatory\nDate: {date}"

DOMAIN_TEMPLATES = {
    "Employment": [
        """EMPLOYMENT AGREEMENT

1. POSITION AND DUTIES
The Employer hereby employs the Employee as {title}. The Employee shall perform all duties and responsibilities customarily associated with such position and such other duties as assigned by executive officers. The Employee agrees to devote full business time, attention, and effort to the performance of duties.

2. COMPENSATION AND BENEFITS
Employer agrees to pay Employee a base annual salary of ${salary}, payable in accordance with normal payroll practices. Employee shall be eligible for performance bonuses, health insurance, paid time off, and employee benefits in accordance with company policies.

3. DURATION AND TERMINATION
This employment is at-will and may be terminated by either party upon thirty (30) days written notice. In the event of termination for Cause (including gross negligence, fraud, or conviction of a felony), employment shall terminate immediately without severance pay.

4. NON-COMPETE AND NON-SOLICITATION
During employment and for a period of twelve (12) months following termination, Employee shall not directly or indirectly engage in competitive business activities within the territory or solicit Employer's clients, vendors, or employees.""",
        """EXECUTIVE EMPLOYMENT CONTRACT

Article I - Appointment & Scope
Company hereby appoints Executive as Chief Technology Officer / Director. Executive accepts the appointment and agrees to faithfully execute all managerial, technical, and operational duties.

Article II - Remuneration & Equity
Company shall compensate Executive with an annual base rate of ${salary}, plus eligibility for stock option grants subject to a four-year vesting schedule with a one-year cliff. Vacation allowance shall be 20 business days per annum.

Article III - Termination & Severance
If Company terminates Executive's employment without Cause or Executive resigns for Good Reason, Executive shall receive severance equal to six (6) months of base salary plus continuation of health benefits.

Article IV - Inventions and Intellectual Property
Executive agrees that all inventions, technical improvements, source code, designs, and work product developed during the scope of employment belong exclusively to the Company as work-for-hire."""
    ],

    "NDA / Confidentiality": [
        """MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" refers to all non-public, proprietary information disclosed by one Party ("Disclosing Party") to the other Party ("Receiving Party"), whether orally, in writing, or electronically, including technical data, trade secrets, customer lists, business plans, financial structures, source code, and algorithms.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to maintain the strict confidentiality of all Confidential Information using at least the same degree of care as it uses for its own proprietary information. The Receiving Party shall not disclose, copy, distribute, or reverse-engineer any Confidential Information to third parties without prior written consent.

3. EXCLUSIONS FROM CONFIDENTIALITY
Confidential Information does not include information that: (a) becomes publicly known through no breach of Receiving Party; (b) was already known to Receiving Party prior to disclosure; (c) is independently developed without reference to Disclosing Party's information.

4. TERM AND RETURN OF MATERIALS
The confidentiality obligations herein shall survive for a period of five (5) years from the effective date. Upon request, Receiving Party shall promptly return or destroy all physical and electronic copies of Confidential Information.""",
        """PROPRIETARY INFORMATION AND SECRECY AGREEMENT

WHEREAS, the parties desire to explore a potential strategic transaction and in connection therewith will exchange sensitive business and technical information.

SECTION 1. CONFIDENTIALITY RESTRICTIONS
Recipient agrees to hold all disclosed trade secrets, product roadmaps, pricing models, and proprietary datasets in strict confidence. Recipient shall restrict access solely to its employees who have a direct need-to-know and are bound by written non-disclosure obligations.

SECTION 2. INJUNCTIVE RELIEF
The parties acknowledge that unauthorized disclosure or use of Confidential Information would cause irreparable harm for which monetary damages alone would be inadequate. Disclosing Party shall be entitled to seek equitable relief, including temporary restraining orders and preliminary injunctions."""
    ],

    "Vendor / Supplier": [
        """MASTER VENDOR & SUPPLIER AGREEMENT

1. SUPPLY OF GOODS AND PRODUCTS
Supplier agrees to sell and deliver, and Buyer agrees to purchase, the goods and materials listed in attached Purchase Orders ("Products"). Supplier warrants that all Products supplied shall strictly conform to specifications, quality standards, and industry requirements.

2. PURCHASE ORDERS AND DELIVERY SCHEDULES
Buyer shall issue written Purchase Orders specifying product quantities, requested delivery dates, and shipping terms (FOB Destination). Supplier shall confirm orders within two (2) business days. Time is of the essence regarding all scheduled delivery dates.

3. INSPECTION, ACCEPTANCE, AND DEFECTIVE GOODS
Buyer reserves the right to inspect all delivered goods within ten (10) business days. Defective, damaged, or non-conforming items may be rejected and returned to Supplier at Supplier's sole risk and expense for full credit or replacement.

4. PRICING AND PAYMENT TERMS
Product pricing shall remain fixed for the duration of the agreement term. Payment terms shall be Net 60 days following receipt of correct invoice and accepted Products. Supplier warrants free and clear title to all supplied goods.""",
        """PROCUREMENT AND GOODS SUPPLY CONTRACT

Clause 1. Vendor Obligations
Vendor agrees to manufacture, package, label, and transport goods to Customer's designated distribution centers. Vendor covenants that all raw materials and inventory comply with applicable environmental and safety regulations.

Clause 2. Warranty & Remedies
Vendor expressly warrants that all products sold hereunder shall be new, merchantable, free from defects in material and workmanship, and fit for their intended purpose for a period of twenty-four (24) months from delivery.

Clause 3. Volume Rebates & Lead Times
Vendor agrees to maintain lead times not exceeding 14 calendar days. If annual purchase volume exceeds $1,000,000, Vendor shall issue Customer a 3% annual rebate paid quarterly."""
    ],

    "Service Agreement": [
        """MASTER SERVICES AGREEMENT (MSA)

1. SERVICES AND STATEMENTS OF WORK (SOW)
Service Provider agrees to perform professional services for Client as described in individual Statements of Work ("SOW") executed from time to time by both parties. Each SOW shall detail the scope of work, project milestones, deliverables, schedule, and fee structure.

2. PERFORMANCE STANDARDS AND SERVICE LEVELS
Service Provider shall perform all services in a professional, workmanlike manner exercising reasonable skill and diligence consistent with industry best standards. Service Provider agrees to meet designated Service Level Agreements (SLAs) set forth in the applicable SOW.

3. COMPENSATION AND INVOICING
Client shall compensate Service Provider according to the rates and milestone schedules set forth in the applicable SOW. Invoices shall be submitted monthly and paid within thirty (30) days of invoice date. Late payments shall accrue interest at 1.5% per month.

4. INDEPENDENT CONTRACTOR STATUS
Service Provider is an independent contractor. Neither Service Provider nor its personnel shall be deemed employees, partners, or joint venturers of Client for any purpose.""",
        """PROFESSIONAL SERVICES CONTRACT

Section 1. Engagement & Deliverables
Client hereby engages Contractor to render consulting, analytical, and management services. Contractor agrees to deliver project reports, software code, and documentation specified in Exhibit A by the agreed completion deadline.

Section 2. Revisions & Scope Changes
Any request by Client to modify the scope of services, deliverables, or timeline must be set forth in a formal written Change Order signed by both parties, detailing adjustments to fees and timelines.

Section 3. Acceptance Testing
Client shall have a period of fourteen (14) business days following delivery of each milestone to evaluate and test the deliverables against acceptance criteria."""
    ],

    "Software / IT": [
        """SOFTWARE LICENSE AND SAAS AGREEMENT

1. GRANT OF LICENSE / SAAS ACCESS
Licensor hereby grants to Licensee a non-exclusive, non-transferable, world-wide license to access and use Licensor's cloud-based Software platform ("SaaS Service") solely for Licensee's internal business operations during the Subscription Term.

2. RESTRICTIONS ON USE
Licensee shall not: (a) reverse engineer, decompile, or disassemble the Software source code; (b) lease, sell, sublicense, or host the SaaS Service for third parties; (c) attempt to bypass security features or API rate limits; (d) remove copyright notices from software documentation.

3. SERVICE AVAILABILITY AND MAINTENANCE
Licensor shall use commercially reasonable efforts to make the SaaS platform available with a Monthly Uptime Percentage of at least 99.9%. Scheduled maintenance shall occur during low-usage maintenance windows with advance notice provided to Licensee.

4. INTELLECTUAL PROPERTY RIGHTS
Licensor retains all right, title, and interest in and to the Software, source code, underlying algorithms, UI designs, and related documentation. No ownership rights are transferred to Licensee under this Agreement.""",
        """IT INFRASTRUCTURE & SOFTWARE MAINTENANCE AGREEMENT

Article 1. Scope of IT Services
Provider agrees to deliver IT infrastructure monitoring, cloud server management, database administration, software patch deployment, and cybersecurity incident response services to Customer.

Article 2. Data Protection & Security
Provider agrees to implement administrative, technical, and physical safeguards (SOC 2, ISO 27001 compliant) to protect Customer data stored on cloud hosting nodes from unauthorized access, breach, or loss.

Article 3. Software Upgrades & API Integration
Provider shall deliver regular software bug fixes, feature updates, and REST API access. Custom API integrations shall be billed at Provider's standard professional development hourly rates."""
    ],

    "Lease / Rental": [
        """COMMERCIAL REAL ESTATE LEASE AGREEMENT

1. DEMISED PREMISES AND TERM
Lessor hereby leases to Lessee, and Lessee leases from Lessor, the commercial office space located at {address_a} ("Premises"), consisting of approximately {sqft} square feet, for a term of five (5) years commencing on the Commencement Date.

2. RENT AND SECURITY DEPOSIT
Lessee agrees to pay Lessor a Monthly Base Rent of ${rent}, due on the first day of each calendar month. Upon execution, Lessee shall deposit with Lessor a Security Deposit of ${deposit} as security for faithful performance of lease terms.

3. USE OF PREMISES AND MAINTENANCE
Lessee shall use the Premises strictly for commercial office purposes and shall maintain the interior in good condition. Lessor shall remain responsible for structural repairs, roof maintenance, and common area maintenance (CAM).

4. DEFAULT AND EVICTION
In the event Lessee fails to pay rent when due or breaches lease covenants and fails to cure within ten (10) days after written notice, Lessor shall have the right to terminate the lease, re-enter the Premises, and seek legal eviction.""",
        """EQUIPMENT RENTAL CONTRACT

1. RENTAL OF EQUIPMENT
Lessor agrees to rent to Lessee, and Lessee agrees to rent from Lessor, the heavy machinery and industrial equipment listed in Schedule A ("Equipment").

2. RENTAL FEES AND DEPOSIT
Lessee shall pay rental fees of ${rent} per month. Lessee shall operate equipment strictly according to manufacturer operating guidelines and maintain full hazard and liability insurance coverage naming Lessor as additional insured.

3. RETURN OF EQUIPMENT
At the expiration of the rental term, Lessee shall return equipment to Lessor in good operating order, reasonable wear and tear excepted. Lessee shall be liable for damage resulting from improper operation or neglect."""
    ],

    "Construction": [
        """STANDARD CONSTRUCTION CONTRACT

1. SCOPE OF WORK
Contractor agrees to furnish all labor, materials, equipment, supervision, and tools necessary to complete the construction project described as {project} at {address_a} in strict compliance with approved blueprints, engineering drawings, and specifications.

2. CONTRACT PRICE AND PAYMENT SCHEDULE
Owner agrees to pay Contractor a total fixed Contract Price of ${price}. Progress payments shall be made monthly based on percentage of completed work certified by the Architect, subject to a 10% retainage held until final project completion.

3. PROJECT TIMELINE AND DELAYS
Contractor shall commence construction on {date} and achieve Substantial Completion within {months} months. Delays caused by force majeure, acts of God, or unapproved Owner change orders shall extend the completion timeline accordingly.

4. SUBCONTRACTORS AND PERMITS
Contractor shall obtain all necessary building permits and municipal licenses. Contractor shall be fully responsible for the acts, omissions, and performance of all subcontractors hired on the site.""",
        """ARCHITECTURAL AND CONSTRUCTION MANAGEMENT AGREEMENT

SECTION I. ARCHITECTURAL SERVICES & DESIGN
Architect agrees to draft schematic designs, construction documentation, structural blueprints, and assist Owner in securing municipal zoning approvals for the commercial development project.

SECTION II. CONTRACTOR OBLIGATIONS & SAFETY
General Contractor shall maintain strict workplace safety standards (OSHA compliance), hazard insurance, and worker's compensation coverage. Contractor warrants all structural construction against defects for a period of ten (10) years from completion.

SECTION III. CHANGE ORDERS & UNFORESEEN SITE CONDITIONS
Any alteration to building specifications or price must be documented in a written Change Order signed by Owner, Contractor, and Lead Architect prior to executing modified work."""
    ],

    "Partnership": [
        """PARTNERSHIP DEED AND JOINT VENTURE AGREEMENT

1. FORMATION AND BUSINESS PURPOSE
The Partners hereby form a general partnership / joint venture under the business name "{company_name}". The primary business purpose shall be to jointly develop, market, and commercialize {product} and related venture activities.

2. CAPITAL CONTRIBUTIONS AND PERCENTAGE INTEREST
Partner A shall contribute ${contribution_a} (representing 50% interest) and Partner B shall contribute ${contribution_b} (representing 50% interest) to the initial capital pool of the partnership. Capital accounts shall be maintained accordingly.

3. PROFIT AND LOSS ALLOCATION
Net profits and losses of the partnership shall be shared between the Partners strictly in proportion to their respective capital percentage interests. Distributions of profit shall occur quarterly upon mutual agreement of Partners.

4. MANAGEMENT, VOTING, AND DISSOLUTION
All major operational, financial, and strategic decisions shall require unanimous approval of both Partners. In the event of deadlocks or voluntary withdrawal, the non-withdrawing Partner shall have the first right of refusal to buy out the interest.""",
        """STRATEGIC ALLIANCE & JOINT VENTURE CONTRACT

Clause 1. Objectives of Alliance
The Parties agree to combine technical expertise, intellectual property, and distribution networks to co-develop commercial products. Neither Party shall enter into competing joint ventures in the designated territory during the term.

Clause 2. Governance Committee
The Joint Venture shall be managed by a Steering Committee consisting of two representatives appointed by each Party. The Steering Committee shall meet monthly to approve operational budgets and strategic direction.

Clause 3. Dissolution & Asset Distribution
Upon expiration or early termination of this Joint Venture, all accumulated liabilities shall be liquidated, remaining cash reserves distributed according to ownership ratios, and pre-existing IP shall revert to its original owner."""
    ],

    "Loan / Financial": [
        """CREDIT FACILITY AND LOAN AGREEMENT

1. THE LOAN FACILITY
Lender agrees to make available to Borrower a principal credit facility in the aggregate amount of ${loan_amount} ("Principal"). Borrower agrees to repay the Principal together with accrued interest in accordance with the payment schedule attached hereto.

2. INTEREST RATE AND REPAYMENT TERMS
Interest shall accrue on the outstanding Principal balance at an annual fixed rate of {interest_rate}% per annum. Borrower shall make monthly payments of principal and interest on the first day of each month until the Maturity Date of {maturity_date}.

3. COVENANTS AND EVENTS OF DEFAULT
Borrower covenants to maintain minimum liquidity ratios and submit quarterly financial statements to Lender. An Event of Default shall occur if Borrower fails to pay any amount when due, becomes insolvent, or breaches financial covenants.

4. COLLATERAL AND SECURITY INTEREST
To secure payment of all obligations hereunder, Borrower grants to Lender a first-priority security interest and lien in all accounts receivable, equipment, inventory, and general intangibles of Borrower under UCC Article 9.""",
        """PROMISSORY NOTE & DEBT AGREEMENT

FOR VALUE RECEIVED, the undersigned Borrower promises to pay to the order of Lender the principal sum of ${loan_amount}, together with simple interest thereon at the rate of {interest_rate}% per year.

Article I. Default and Acceleration
If Borrower defaults in the payment of any installment for more than fifteen (15) days, Lender may declare the entire unpaid principal balance and accrued interest immediately due and payable without demand or notice.

Article II. Late Fees & Legal Fees
Borrower shall pay a late fee equal to 5% of any overdue payment. In the event of legal action to collect on this Note, Borrower agrees to pay Lender's reasonable attorneys' fees and court costs."""
    ],

    "General Commercial": [
        """COMMERCIAL DISTRIBUTION AND AGENCY AGREEMENT

1. APPOINTMENT OF DISTRIBUTOR
Principal hereby appoints Distributor as its exclusive commercial distributor for the sale and marketing of Products within the defined Territory ({territory}). Distributor accepts such appointment and agrees to aggressively promote sales.

2. ORDERS, PRICING, AND MINIMUM QUOTAS
Distributor agrees to purchase Products at Wholesale Price list. Distributor agrees to achieve Minimum Annual Purchase Quotas set forth in Schedule B. Failure to meet quotas shall entitle Principal to terminate exclusivity.

3. TRADEMARKS AND BRANDING
Distributor is granted a limited, non-exclusive right to use Principal's registered trademarks solely in connection with marketing and distributing Products in the Territory. All goodwill remains the property of Principal.

4. TERM AND CANCELLATION
This agreement shall remain effective for a period of three (3) years. Either party may cancel upon ninety (90) days written notice prior to annual renewal.""",
        """COMMERCIAL SALES AND FRANCHISE AGREEMENT

Section 1. Franchise Grant
Franchisor grants Franchisee the right and license to establish and operate a commercial retail franchise store using Franchisor's proprietary business systems, logos, and operating manuals.

Section 2. Royalties & Marketing Contributions
Franchisee agrees to pay Franchisor a weekly Royalty Fee equal to 5% of Gross Sales, plus a 2% contribution to the National Advertising Fund. Payments shall be submitted via automated electronic transfer.

Section 3. Operational Standards
Franchisee agrees to strictly adhere to operational guidelines, store layout standards, inventory procurement rules, and customer service benchmarks mandated by Franchisor."""
    ],

    "Other": [
        """GENERAL SETTLEMENT AGREEMENT AND MUTUAL RELEASE

1. SETTLEMENT OF DISPUTES
WHEREAS, disputes have arisen between Party A and Party B regarding certain prior commercial transactions; NOW THEREFORE, to avoid expense and inconvenience of litigation, the parties agree to resolve all pending claims as set forth herein.

2. SETTLEMENT PAYMENT AND RELEASE
In consideration of Party A paying Party B the settlement sum of ${settlement_amount}, Party B hereby fully releases, remises, and forever discharges Party A from any and all past, present, or future claims, demands, liabilities, or causes of action.

3. NO ADMISSION OF LIABILITY
The parties acknowledge that this Agreement represents a compromise of disputed claims and that neither the execution nor performance hereof shall be construed as an admission of liability or fault by any party.

4. CONFIDENTIAL SETTLEMENT
The terms, conditions, and financial amounts of this settlement shall remain strictly confidential and shall not be disclosed to any third party except as required by law or to tax advisors.""",
        """GENERAL WAIVER, INDEMNITY AND LIABILITY RELEASE

1. ACKNOWLEDGMENT OF RISK
Participant / Releasor acknowledges and understands that participating in activities involves inherent risks of property damage or physical injury. Releasor assumes full responsibility for all such risks.

2. RELEASE AND HOLD HARMLESS
Releasor hereby waives, releases, and covenants not to sue Organization, its officers, employees, or representatives from any liability, claims, or demands arising out of participation.

3. GOVERNING LAW AND SEVERABILITY
This waiver shall be construed broadly to provide a release to the maximum extent permissible under law. If any clause is deemed unenforceable, remaining terms shall remain in full force."""
    ]
}

def generate_sample_contract(domain_id: str, domain_name: str, sample_idx: int) -> str:
    """Generate a realistic, multi-paragraph legal contract for a given domain."""
    party_a_options = ["Acme Legal Technologies Inc.", "Global Supply Chain Corp.", "Apex Enterprise Solutions LLC", "Vanguard Financial Ltd.", "Horizon Commercial Properties", "Pinnacle Software Inc.", "Atlas Construction Group"]
    party_b_options = ["Beacon Logistics Ltd.", "Nexus Consulting Partners", "Summit Industrial Holdings", "Omega Retail Systems", "Zenith Capital Advisors", "John Doe (Individual)", "Jane Smith (Individual)"]
    
    party_a = random.choice(party_a_options)
    party_b = random.choice(party_b_options)
    date = f"202{random.randint(3, 6)}-0{random.randint(1, 9)}-{random.randint(10, 28)}"
    address_a = f"{random.randint(100, 999)} Commercial Blvd, Suite {random.randint(10, 500)}, New York, NY 10001"
    address_b = f"{random.randint(100, 999)} Enterprise Way, Floor {random.randint(1, 20)}, San Francisco, CA 94105"
    
    preamble = random.choice(LEGAL_PREAMBLES).format(
        date=date, party_a=party_a, party_b=party_b, address_a=address_a, address_b=address_b
    )
    
    templates = DOMAIN_TEMPLATES[domain_name]
    core_body = random.choice(templates).format(
        title=random.choice(["Senior Software Engineer", "Director of Operations", "Legal Counsel", "Account Executive"]),
        salary=f"{random.randint(80, 250)},000",
        address_a=address_a,
        sqft=f"{random.randint(2000, 25000)}",
        rent=f"{random.randint(3000, 45000)}",
        deposit=f"{random.randint(5000, 50000)}",
        project=random.choice(["Commercial Shopping Complex", "Data Center Facility", "Residential High-Rise"]),
        price=f"{random.randint(500, 5000)},000",
        months=f"{random.randint(6, 36)}",
        company_name=f"{party_a.split()[0]} & {party_b.split()[0]} Ventures",
        product=random.choice(["AI Software Platform", "Industrial Hardware Component", "Global Distribution Network"]),
        contribution_a=f"{random.randint(100, 1000)},000",
        contribution_b=f"{random.randint(100, 1000)},000",
        loan_amount=f"{random.randint(250, 5000)},000",
        interest_rate=f"{random.uniform(4.5, 9.5):.2f}",
        maturity_date=f"20{random.randint(28, 35)}-12-31",
        territory=random.choice(["North America", "European Union", "Asia-Pacific", "Worldwide"]),
        settlement_amount=f"{random.randint(50, 500)},000",
        date=date
    )
    
    boilerplate1 = random.choice(LEGAL_BOILERPLATE)
    boilerplate2 = random.choice(LEGAL_BOILERPLATE)
    while boilerplate2 == boilerplate1:
        boilerplate2 = random.choice(LEGAL_BOILERPLATE)
        
    signatures = SIGNATURE_BLOCK.format(date=date)
    
    full_contract_text = f"{preamble}\n\n{core_body}{boilerplate1}{boilerplate2}{signatures}"
    return full_contract_text

def create_dataset(samples_per_domain: int = 40) -> pd.DataFrame:
    """Generate balanced dataset across all 11 contract domains."""
    with open(DOMAIN_CONFIG_PATH, "r") as f:
        config = json.load(f)
        
    domains = config["domains"]
    records = []
    contract_counter = 1
    
    print(f"Generating synthetic legal dataset with {samples_per_domain} samples per domain across {len(domains)} domains...")
    
    for dom in domains:
        domain_name = dom["name"]
        domain_id = dom["id"]
        
        for i in range(samples_per_domain):
            text = generate_sample_contract(domain_id, domain_name, i)
            contract_id = f"CTR-{contract_counter:04d}"
            records.append({
                "contract_id": contract_id,
                "text": text,
                "domain": domain_name
            })
            contract_counter += 1
            
    df = pd.DataFrame(records)
    
    # Save CSV
    os.makedirs(os.path.dirname(OUTPUT_CSV_PATH), exist_ok=True)
    df.to_csv(OUTPUT_CSV_PATH, index=False)
    print(f"Dataset successfully created and saved to {OUTPUT_CSV_PATH}")
    return df

def print_dataset_statistics(df: pd.DataFrame):
    """Print dataset statistics, counts, word lengths, and train/val/test splits."""
    print("\n" + "="*60)
    print("DATASET STATISTICS AND SUMMARY REPORT")
    print("="*60)
    print(f"Total Contracts: {len(df)}")
    print(f"Number of Unique Domains: {df['domain'].nunique()}")
    
    # Per-domain distribution
    print("\nDomain Label Distribution:")
    print("-" * 40)
    counts = df['domain'].value_counts()
    for domain, count in counts.items():
        percentage = (count / len(df)) * 100
        print(f"  • {domain:<25}: {count:3d} ({percentage:.1f}%)")
        
    # Word count stats
    word_counts = df['text'].apply(lambda x: len(x.split()))
    print("\nContract Document Word Lengths:")
    print("-" * 40)
    print(f"  • Minimum Words : {word_counts.min()}")
    print(f"  • Mean Words    : {word_counts.mean():.1f}")
    print(f"  • Median Words  : {word_counts.median():.1f}")
    print(f"  • Maximum Words : {word_counts.max()}")
    
    # Train / Val / Test Split
    train_size = int(len(df) * 0.70)
    val_size = int(len(df) * 0.15)
    test_size = len(df) - train_size - val_size
    print("\nData Split Breakdown (Stratified 70/15/15):")
    print("-" * 40)
    print(f"  • Train Set     : {train_size} contracts")
    print(f"  • Validation Set: {val_size} contracts")
    print(f"  • Test Set       : {test_size} contracts")
    print("="*60 + "\n")

if __name__ == "__main__":
    df = create_dataset(samples_per_domain=40)
    print_dataset_statistics(df)
