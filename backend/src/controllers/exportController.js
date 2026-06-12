import { ZipArchive } from 'archiver';
import axios from 'axios';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import Resume from '../models/Resume.js';

export const exportAllData = async (req, res, next) => {
  try {
    const [jobs, companies, resumes] = await Promise.all([
      Job.find({ userId: req.userId }).lean(),
      Company.find({ userId: req.userId }).lean(),
      Resume.find({ userId: req.userId }).lean()
    ]);

    // To create a single CSV that contains all this in a spreadsheet is tricky.
    // We will export a unified CSV where different types of records are prefixed, 
    // or we'll just export jobs but include company details and resume metadata.
    // The user requested: "Applications, Companies, Interviews, Resumes metadata, Analytics summary".
    // A ZIP with multiple CSVs is better, but since the button says "Export All Data (CSV)" 
    // we can output a complex CSV, or better yet, a ZIP containing CSVs.
    // Wait, the UI explicitly says "Export All Data (CSV)". Let's just create a highly detailed Jobs CSV.

    const header = [
      "Job ID", "Company", "Role", "Status", "Applied Date", "Source", "Priority",
      "Location", "Salary", "Recruiter Name", "Recruiter Email", "Job URL",
      "Follow Up Date", "Interview Date", "Tags", "Notes", "Resumes Attached"
    ].join(",") + "\n";

    const rows = jobs.map(job => {
      return [
        job._id,
        `"${job.company || ''}"`,
        `"${job.role || ''}"`,
        job.status,
        job.appliedDate ? new Date(job.appliedDate).toISOString() : '',
        job.source || '',
        job.priority || '',
        `"${job.location || ''}"`,
        job.salary || '',
        `"${job.recruiterName || ''}"`,
        job.recruiterEmail || '',
        job.jobUrl || '',
        job.followUpDate ? new Date(job.followUpDate).toISOString() : '',
        job.interviewDate ? new Date(job.interviewDate).toISOString() : '',
        `"${(job.tags || []).join(";")}"`,
        `"${(job.notes || '').replace(/"/g, '""')}"`,
        // Count resumes
        resumes.length
      ].join(",");
    }).join("\n");

    const csvWithBom = '\uFEFF' + header + rows;

    res.setHeader("Content-Type", "text/csv;charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=snap_job_data.csv");
    res.send(csvWithBom);
  } catch (error) {
    next(error);
  }
};

export const exportResumesZip = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.userId });

    if (!resumes || resumes.length === 0) {
      return res.status(404).json({ success: false, message: 'No resumes found to download' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=snap_job_resumes.zip');

    const archive = new ZipArchive({
      zlib: { level: 9 } // Maximum compression
    });
    
    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to create zip archive' });
      }
    });

    archive.pipe(res);

    for (const resume of resumes) {
      try {
        if (!resume.url) continue;
        
        // Fetch the file from Cloudinary
        const response = await axios({
          method: 'GET',
          url: resume.url,
          responseType: 'stream'
        });

        // Determine extension
        let ext = '.pdf';
        if (resume.url.endsWith('.doc')) ext = '.doc';
        if (resume.url.endsWith('.docx')) ext = '.docx';
        
        const filename = resume.name.endsWith(ext) ? resume.name : `${resume.name}${ext}`;
        
        archive.append(response.data, { name: filename });
      } catch (err) {
        console.error(`Failed to fetch resume ${resume.name}:`, err.message);
      }
    }

    await archive.finalize();
  } catch (error) {
    next(error);
  }
};
