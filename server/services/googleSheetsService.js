import { google } from 'googleapis';

export class GoogleSheetsService {
  constructor() {
    this.spreadsheetId = '1HzF3Cqc7VCH3aYC_SX5xNrg7iPFYycHhfbaDBto0A98';
    this.range = 'Sheet1!A:H';
    this.sheets = google.sheets({ version: 'v4' });
    this.auth = null;
    this.isAuthenticated = false;
  }

  async initializeAuth() {
    if (this.isAuthenticated) return;

    try {
      // Check if we have service account credentials
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY;
      const projectId = process.env.GOOGLE_PROJECT_ID;

      if (serviceAccountEmail && privateKey && projectId) {
        // Use service account authentication
        this.auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: serviceAccountEmail,
            private_key: privateKey.replace(/\\n/g, '\n'),
            project_id: projectId,
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        this.isAuthenticated = true;
        console.log('✅ Authenticated with Google Sheets API using service account');
      } else {
        // Fallback to public access (read-only) or in-memory storage
        console.log('⚠️ No service account credentials found. Using fallback mode.');
        this.useFallbackMode = true;
        this.jobs = [];
        this.loadJobsFromMemory();
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      console.log('⚠️ Falling back to in-memory storage');
      this.useFallbackMode = true;
      this.jobs = [];
      this.loadJobsFromMemory();
    }
  }

  // Load jobs from memory (in production, this would fetch from Google Sheets)
  loadJobsFromMemory() {
    // For now, we'll use some sample data
    this.jobs = [
      {
        date: '2024-01-15',
        customerName: 'John Doe',
        mobile: '1234567890',
        tvModel: 'Samsung 55"',
        workDone: 'Screen replacement',
        price: 500,
        partsCost: 300,
        profit: 200,
        tempId: '0'
      },
      {
        date: '2024-01-16',
        customerName: 'Jane Smith',
        mobile: '0987654321',
        tvModel: 'LG 43"',
        workDone: 'Power supply repair',
        price: 150,
        partsCost: 50,
        profit: 100,
        tempId: '1'
      }
    ];
  }

  async addJob(job) {
    try {
      await this.initializeAuth();
      console.log('Adding job:', job);
      
      if (this.useFallbackMode) {
        // Use in-memory storage as fallback
        const newJob = {
          ...job,
          tempId: this.jobs.length.toString()
        };
        this.jobs.push(newJob);
        console.log('Job added to memory storage');
        return { success: true, data: newJob };
      }

      // Use real Google Sheets API
      const values = [
        [
          job.date,
          job.customerName,
          job.mobile,
          job.tvModel,
          job.workDone,
          job.price,
          job.partsCost || 0,
          job.profit
        ]
      ];

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values
        }
      });

      console.log('✅ Job added to Google Sheets successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error adding job:', error);
      throw new Error(`Failed to add job: ${error.message}`);
    }
  }

  async getAllJobs() {
    try {
      await this.initializeAuth();
      console.log('Fetching all jobs');
      
      if (this.useFallbackMode) {
        // Return jobs from memory storage
        return this.jobs;
      }

      // Use real Google Sheets API
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.range,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        console.log('No data found in Google Sheet');
        return []; // No data or only headers
      }

      // Skip header row and convert to job objects
      const jobs = rows.slice(1).map((row, index) => ({
        date: row[0] || '',
        customerName: row[1] || '',
        mobile: row[2] || '',
        tvModel: row[3] || '',
        workDone: row[4] || '',
        price: parseFloat(row[5]) || 0,
        partsCost: parseFloat(row[6]) || 0,
        profit: parseFloat(row[7]) || 0,
        tempId: index.toString()
      }));

      console.log(`✅ Fetched ${jobs.length} jobs from Google Sheets`);
      return jobs;
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  }

  async updateJob(id, updatedJob) {
    try {
      await this.initializeAuth();
      console.log('Updating job:', id, updatedJob);
      
      if (this.useFallbackMode) {
        const jobIndex = parseInt(id);
        if (jobIndex >= 0 && jobIndex < this.jobs.length) {
          this.jobs[jobIndex] = { ...this.jobs[jobIndex], ...updatedJob };
          console.log('Job updated in memory storage');
          return { success: true, data: this.jobs[jobIndex] };
        } else {
          throw new Error('Job not found');
        }
      }

      // Use real Google Sheets API
      // id is the array index, so we need to convert to Google Sheets row number
      // Array index 0 = Google Sheets row 2 (after header row)
      const rowNumber = parseInt(id) + 2; // +1 for header row, +1 for 1-indexed Google Sheets
      
      const values = [
        [
          updatedJob.date,
          updatedJob.customerName,
          updatedJob.mobile,
          updatedJob.tvModel,
          updatedJob.workDone,
          updatedJob.price,
          updatedJob.partsCost || 0,
          updatedJob.profit
        ]
      ];

      console.log(`Updating row ${rowNumber} in Google Sheets`);

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Sheet1!A${rowNumber}:H${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values
        }
      });

      console.log('✅ Job updated in Google Sheets successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error updating job:', error);
      throw new Error(`Failed to update job: ${error.message}`);
    }
  }

  async deleteJob(id) {
    try {
      await this.initializeAuth();
      console.log('Deleting job:', id);
      
      if (this.useFallbackMode) {
        const jobIndex = parseInt(id);
        if (jobIndex >= 0 && jobIndex < this.jobs.length) {
          const deletedJob = this.jobs.splice(jobIndex, 1)[0];
          console.log('Job deleted from memory storage');
          return { success: true, data: deletedJob };
        } else {
          throw new Error('Job not found');
        }
      }

      // Use real Google Sheets API
      // id is the array index, so we need to convert to Google Sheets row number
      // Array index 0 = Google Sheets row 2 (after header row)
      const rowNumber = parseInt(id) + 2; // +1 for header row, +1 for 1-indexed Google Sheets
      
      console.log(`Deleting row ${rowNumber} from Google Sheets`);

      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0, // Assuming first sheet
                  dimension: 'ROWS',
                  startIndex: rowNumber - 1, // Google Sheets uses 0-based indexing for batchUpdate
                  endIndex: rowNumber
                }
              }
            }
          ]
        }
      });

      console.log('✅ Job deleted from Google Sheets successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error deleting job:', error);
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  async getDashboardStats() {
    try {
      const jobs = await this.getAllJobs();
      
      const totalJobs = jobs.length;
      const totalRevenue = jobs.reduce((sum, job) => sum + job.price, 0);
      const totalPartsCost = jobs.reduce((sum, job) => sum + (job.partsCost || 0), 0);
      const netProfit = totalRevenue - totalPartsCost;

      return {
        totalJobs,
        totalRevenue,
        totalPartsCost,
        netProfit
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  async exportToCSV() {
    try {
      const jobs = await this.getAllJobs();
      const headers = ['Date', 'Customer Name', 'Mobile', 'TV Model', 'Work Done', 'Price', 'Parts Cost', 'Profit'];
      const csvRows = [headers.join(',')];
      
      jobs.forEach(job => {
        const row = [
          job.date,
          `"${job.customerName}"`,
          job.mobile,
          `"${job.tvModel}"`,
          `"${job.workDone}"`,
          job.price,
          job.partsCost || 0,
          job.profit
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw new Error(`Failed to export CSV: ${error.message}`);
    }
  }

  // Future methods for actual Google Sheets API integration
  /*
  async addJobToGoogleSheets(job) {
    // Implement Google Sheets API call here
    // You'll need to set up authentication and use the googleapis library
  }

  async fetchJobsFromGoogleSheets() {
    // Implement Google Sheets API call here
  }

  async updateJobInGoogleSheets(id, updatedJob) {
    // Implement Google Sheets API call here
  }

  async deleteJobFromGoogleSheets(id) {
    // Implement Google Sheets API call here
  }
  */
}