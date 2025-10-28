# Testing Guide: Quick Evaluation System

## How to Test the Implementation

### Prerequisite Setup
Ensure your questions are configured as follows:

```json
{
  "Multiple Choice Auto-Scored": {
    "question_type": "multiple_choice",
    "points": 10,
    "options": [
      { "text": "Option A", "value": "a", "points": 10 },
      { "text": "Option B", "value": "b", "points": 5 }
    ],
    "media_upload_config": {
      "required": false,
      "allowedTypes": ["image/*", "application/pdf"],
      "maxSize": 5242880
    }
  },
  
  "Text Question (Manual Review)": {
    "question_type": "text",
    "points": 0,
    "media_upload_config": {
      "required": false,
      "allowedTypes": ["image/*", "application/pdf"],
      "maxSize": 5242880
    }
  },
  
  "Upload Only (Manual Review)": {
    "question_type": "media_only",
    "points": 0,
    "media_upload_config": {
      "required": true,
      "allowedTypes": ["image/*", "application/pdf"],
      "maxSize": 5242880
    }
  },
  
  "Multiple Choice with Upload (Manual Review)": {
    "question_type": "multiple_choice",
    "points": 10,
    "options": [
      { "text": "Yes, attached", "value": "yes", "points": 0, "showUpload": true },
      { "text": "No", "value": "no", "points": 10 }
    ],
    "media_upload_config": {
      "required": true,
      "allowedTypes": ["image/*", "application/pdf"],
      "maxSize": 5242880
    }
  }
}
```

### Test Scenario 1: Auto-Scored Questions Only
1. Create an application with 3 multiple-choice questions (no uploads)
2. Each worth 10 points
3. User submits choosing Option A (10 pts), Option A (10 pts), Option B (5 pts)
4. **Expected Result:**
   - Quick evaluation shows: 25/30 (83%)
   - All questions displayed with their scores
   - No upload warning (unless there are any questions with uploads)

### Test Scenario 2: Mixed Questions (Auto-Scored + Manual Review)
1. Create application with:
   - Q1: Multiple Choice (10 pts) - auto-scored
   - Q2: Text (0 pts) - manual review
   - Q3: Multiple Choice with Upload (10 pts) - manual review
2. User submits: Q1=10pts, Q2="Some text", Q3="Yes"+uploads file
3. **Expected Result:**
   - Quick evaluation shows: 10/10 (100%)
   - Only Q1 appears in the report
   - Warning: "Uploads under manual review"
   - Q2 and Q3 saved but not shown in quick evaluation

### Test Scenario 3: View Submission Details
1. After submission from Scenario 2
2. User goes to "My Submissions" and clicks "View Details"
3. **Expected Result:**
   - Q1 shows: "10/10 pts" with answer
   - Q2 shows: Text answer (no points)
   - Q3 shows: Answer + "Uploaded Files:" with file download link
   - Files grouped under their question (not separate section)

### Test Scenario 4: Media-Only Questions
1. Create application with:
   - Q1: Media Only (0 pts) - upload only
2. User uploads a file
3. **Expected Result:**
   - Quick evaluation shows: 0/0 (0%)
   - Question appears in submission details
   - File shown under that question with no score
   - "Under manual review" warning

## Expected Behavior Summary

### After Form Submission
✅ User sees `QuickEvaluationReport` component
✅ Only auto-scoreable questions counted in score
✅ Answers grouped by category
✅ Percentage shown
✅ Manual review warning for uploads

### In Submission Details
✅ All answers shown (scored and unscored)
✅ Scored questions show points
✅ Media-only questions don't show points
✅ Uploaded files appear under their question
✅ Download links work for files

## Scoring Logic
```
Auto-Scored (Counted):
- Multiple Choice questions with points > 0 and NO upload requirement

NOT Auto-Scored (Manual Review):
- media_only questions
- Text questions
- Multiple Choice questions with showUpload=true
- Questions with media_upload_config.required=true (for that option)
```

## Debug Tips
1. Check browser console for any errors during submission
2. Verify questions in database have correct `question_type` and `points`
3. Check that `options` array has `points` values for multiple choice
4. Ensure `media_upload_config` is properly configured
5. Submission status should remain "pending" until manually reviewed

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Quick evaluation not showing | Check that at least one question is auto-scoreable (multiple_choice with points > 0) |
| Uploads not grouped by question | Verify `question_id` is correctly saved in `submission_media` table |
| Points showing as 0 | Ensure question has `points > 0` and option has `points` value |
| Missing files in report | Check that files were successfully uploaded to storage |
