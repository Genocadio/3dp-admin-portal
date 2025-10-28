export type SubmissionReportData = {
  applicationTitle: string
  applicantName: string
  applicantOrganisation?: string
  submittedDate: string
  reviewedDate?: string
  status: "approved" | "rejected" | "under_review" | "pending"
  percentage: number
  categoryScores: Array<{
    title: string
    percentage: number
    answers: Array<{
      questionText: string
      answer: string
      percentage: number
    }>
  }>
  reviewNotes?: string
}

export function generatePDFHTML(reportData: SubmissionReportData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          .container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
          }
          .header {
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .header-logo {
            flex-shrink: 0;
          }
          .header-logo img {
            height: 60px;
            width: auto;
          }
          .header-content {
            flex: 1;
          }
          .header-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 5px;
          }
          .header-subtitle {
            font-size: 14px;
            color: #64748b;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
            font-weight: 600;
          }
          .info-value {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            width: fit-content;
          }
          .status-approved {
            background: #dcfce7;
            color: #166534;
          }
          .status-rejected {
            background: #fee2e2;
            color: #991b1b;
          }
          .status-under-review {
            background: #fef3c7;
            color: #92400e;
          }
          .status-pending {
            background: #e0e7ff;
            color: #3730a3;
          }
          .score-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
          }
          .score-card {
            padding: 20px;
            border-radius: 8px;
            background: #eff6ff;
            border: 2px solid #3b82f6;
          }
          .score-label {
            font-size: 12px;
            color: #0c4a6e;
            text-transform: uppercase;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .score-value {
            font-size: 36px;
            font-weight: bold;
            color: #0369a1;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-top: 30px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
          }
          .category-section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f1f5f9;
            border-radius: 6px;
            margin-bottom: 12px;
          }
          .category-title {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }
          .category-percentage {
            font-size: 16px;
            font-weight: bold;
            color: #3b82f6;
          }
          .answer-item {
            padding: 12px;
            margin-bottom: 10px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
          }
          .answer-question {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 6px;
          }
          .answer-text {
            font-size: 12px;
            color: #475569;
            line-height: 1.5;
            margin-bottom: 6px;
          }
          .answer-score {
            font-size: 11px;
            color: #3b82f6;
            font-weight: 600;
          }
          .review-section {
            margin-top: 30px;
            padding: 20px;
            background: #fef3c7;
            border: 2px solid #fcd34d;
            border-radius: 8px;
          }
          .review-title {
            font-size: 14px;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
          }
          .review-content {
            font-size: 12px;
            color: #78350f;
            line-height: 1.6;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
          }
          .performance-text {
            font-size: 14px;
            font-weight: 600;
            color: #3b82f6;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .container {
              padding: 0.25in;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-logo">
              <img src="/loggo.webp" alt="3DP Logo" />
            </div>
            <div class="header-content">
              <div class="header-title">Submission Report</div>
              <div class="header-subtitle">${reportData.applicationTitle}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Applicant Name</div>
              <div class="info-value">${reportData.applicantName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Status</div>
              <div class="status-badge status-${reportData.status.replace("_", "-")}">
                ${reportData.status.replace("_", " ")}
              </div>
            </div>
            ${
              reportData.applicantOrganisation
                ? `<div class="info-item">
              <div class="info-label">Organisation</div>
              <div class="info-value">${reportData.applicantOrganisation}</div>
            </div>`
                : ""
            }
            <div class="info-item">
              <div class="info-label">Submitted Date</div>
              <div class="info-value">${reportData.submittedDate}</div>
            </div>
            ${
              reportData.reviewedDate
                ? `<div class="info-item">
              <div class="info-label">Reviewed Date</div>
              <div class="info-value">${reportData.reviewedDate}</div>
            </div>`
                : ""
            }
          </div>

          <div class="score-section">
            <div class="score-card">
              <div class="score-label">Overall Score</div>
              <div class="score-value">${reportData.percentage}%</div>
            </div>
            <div class="score-card">
              <div class="score-label">Performance Level</div>
              <div class="performance-text">
                ${
                  reportData.percentage >= 80
                    ? "Excellent"
                    : reportData.percentage >= 60
                      ? "Good"
                      : reportData.percentage >= 40
                        ? "Fair"
                        : "Needs Work"
                }
              </div>
            </div>
          </div>

          <div class="section-title">Evaluation Details</div>
          ${reportData.categoryScores
            .map(
              (category) => `
            <div class="category-section">
              <div class="category-header">
                <div class="category-title">${category.title}</div>
                <div class="category-percentage">${category.percentage}%</div>
              </div>
              ${category.answers
                .map(
                  (answer) => `
                <div class="answer-item">
                  <div class="answer-question">${answer.questionText}</div>
                  <div class="answer-text">${answer.answer}</div>
                  <div class="answer-score">Score: ${answer.percentage}%</div>
                </div>
              `,
                )
                .join("")}
            </div>
          `,
            )
            .join("")}

          ${
            reportData.reviewNotes
              ? `
            <div class="review-section">
              <div class="review-title">Reviewer Notes</div>
              <div class="review-content">${reportData.reviewNotes}</div>
            </div>
          `
              : ""
          }

          <div class="footer">
            <p>This is an automatically generated report. Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function downloadPDFReport(reportData: SubmissionReportData): void {
  const htmlContent = generatePDFHTML(reportData)
  
  const newWindow = window.open("", "", "width=800,height=600")
  if (newWindow) {
    newWindow.document.write(htmlContent)
    newWindow.document.close()
    
    // Wait for content to load then print
    setTimeout(() => {
      newWindow.print()
    }, 250)
  }
}
