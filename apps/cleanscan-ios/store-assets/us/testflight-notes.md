# CleanScan TestFlight Notes

## What to Test

Please test CleanScan on a physical iPhone.

Main flows:

1. Scan a single-page document.
2. Scan a multi-page document.
3. Delete a page before saving.
4. Reorder pages before saving.
5. Save the scan as a PDF.
6. Preview the PDF.
7. Share the PDF to Files or Mail.
8. Recognize text from a scanned document.
9. Create a compressed PDF.
10. Add a handwritten signature and share the signed PDF.
11. Scan a receipt in Receipt mode.
12. Check detected receipt merchant, date, and total.
13. Export receipts as CSV.
14. Rename a document.
15. Delete a document.
16. Close and reopen the app to confirm saved documents remain available.

## Suggested Test Documents

- Receipt
- Printed letter
- Handwritten note
- Contract or form
- Classroom notes
- Low-light scan
- Slightly angled paper

## Feedback Questions

- Did scanning start quickly?
- Was the scanned page clear enough?
- Was it easy to review and reorder pages?
- Did OCR recognize useful text?
- Did the signed PDF look acceptable?
- Was the compressed PDF smaller and still readable?
- Were receipt fields useful enough after OCR?
- Did receipt CSV export work?
- Did sharing work as expected?
- Did anything crash or feel confusing?

## Known Limitations

- The document scanner should be tested on a real iPhone.
- Signature placement is currently fixed near the bottom-right of the final page.
- OCR quality depends on lighting, paper angle, and print clarity.
- Receipt field detection is basic and should be reviewed before export.
- Purchases are not included in this free TestFlight build.

## TestFlight Beta App Description

CleanScan is a simple PDF scanner for iPhone. It scans documents and receipts into PDFs and includes page review, OCR, PDF compression, handwritten signatures, receipt CSV export, preview, and sharing.

Please focus on scanning quality, page review, PDF sharing, OCR results, and signed PDF output.
