import jsPDF from 'jspdf';
import { UserProfile, Reminder, GlucoseReading } from '@/services/firebaseService';

interface ExportData {
  profile: UserProfile;
  reminders: Reminder[];
  glucoseReadings: GlucoseReading[];
  bmi?: number;
  bmiCategory?: string;
  prediction?: string | null;
  confidence?: string | null;
  probabilities?: { NonDiabetic: string; Diabetic: string } | null;
  estimatedHbA1c?: string | null;
}

class PDFExportService {
  private addHeader(doc: jsPDF) {
    // App branding
    doc.setFillColor(9, 103, 210); // health-primary-500
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('VitalSync Health Hub', 20, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Personal Health Report', 20, 26);
  }

  private addUserInfo(doc: jsPDF, profile: UserProfile, yPos: number): number {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Personal Information', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const info = [
      `Name: ${profile.firstName} ${profile.lastName}`,
      `Email: ${profile.email}`,
      `Weight: ${profile.weight} kg`,
      `Height: ${profile.height} cm`,
      `Date of Birth: ${profile.dateOfBirth}`,
      profile.gender ? `Gender: ${profile.gender}` : null,
      profile.age ? `Age: ${profile.age}` : null
    ].filter(item => item !== null) as string[];

    info.forEach(item => {
      doc.text(item, 20, yPos);
      yPos += 7;
    });

    return yPos + 10;
  }

  private addBMIInfo(doc: jsPDF, bmi: number, category: string, yPos: number): number {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BMI Information', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`BMI: ${bmi.toFixed(1)}`, 20, yPos);
    yPos += 7;
    doc.text(`Category: ${category}`, 20, yPos);
    yPos += 7;

    // BMI color coding
    let color = [0, 0, 0];
    if (bmi < 18.5) color = [240, 180, 41]; // warning
    else if (bmi < 25) color = [63, 145, 66]; // success
    else if (bmi < 30) color = [240, 180, 41]; // warning
    else color = [225, 45, 57]; // danger

    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${category}`, 20, yPos);
    doc.setTextColor(0, 0, 0);

    return yPos + 15;
  }

  private addPredictionResults(
    doc: jsPDF,
    prediction: string | null,
    confidence: string | null,
    probabilities: { NonDiabetic: string; Diabetic: string } | null,
    estimatedHbA1c: string | null,
    yPos: number
  ): number {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Diabetes Prediction Results', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    if (!prediction) {
      doc.text('No prediction results available', 20, yPos);
      return yPos + 15;
    }

    const predictionInfo = [
      `Prediction: ${prediction || 'N/A'}`,
      `Confidence: ${confidence || 'N/A'}`,
      `Probability (Non-Diabetic): ${probabilities?.NonDiabetic || 'N/A'}`,
      `Probability (Diabetic): ${probabilities?.Diabetic || 'N/A'}`,
      `Estimated HbA1c: ${estimatedHbA1c || 'N/A'}`
    ];

    predictionInfo.forEach(item => {
      doc.text(item, 20, yPos);
      yPos += 7;
    });

    return yPos + 10;
  }

  private addReminders(doc: jsPDF, reminders: Reminder[], yPos: number): number {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Active Reminders', 20, yPos);
    yPos += 10;

    if (reminders.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No active reminders', 20, yPos);
      return yPos + 15;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Title', 20, yPos);
    doc.text('Time', 80, yPos);
    doc.text('Days', 120, yPos);
    doc.text('Type', 160, yPos);
    doc.text('Completed', 180, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    reminders.forEach(reminder => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(reminder.title.substring(0, 25), 20, yPos);
      doc.text(reminder.time, 80, yPos);
      doc.text(reminder.days.join(', '), 120, yPos);
      doc.text(reminder.type, 160, yPos);
      doc.text(reminder.completed ? 'Yes' : 'No', 180, yPos);
      yPos += 6;
    });

    return yPos + 10;
  }

  private addGlucoseReadings(doc: jsPDF, readings: GlucoseReading[], yPos: number): number {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Glucose Readings', 20, yPos);
    yPos += 10;

    if (readings.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No glucose readings recorded', 20, yPos);
      return yPos + 15;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 20, yPos);
    doc.text('Value (mg/dL)', 80, yPos);
    doc.text('Status', 140, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    const recentReadings = readings.slice(-10); // Show last 10 readings
    
    recentReadings.forEach(reading => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const date = reading.timestamp instanceof Date 
        ? reading.timestamp.toLocaleDateString()
        : new Date(reading.timestamp).toLocaleDateString();
      
      doc.text(date, 20, yPos);
      doc.text(reading.value.toString(), 80, yPos);
      
      // Status based on glucose value
      let status = 'Normal';
      if (reading.value < 70) status = 'Low';
      else if (reading.value > 140) status = 'High';
      
      doc.text(status, 140, yPos);
      yPos += 6;
    });

    return yPos + 10;
  }

  private addFooter(doc: jsPDF) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageSize = doc.internal.pageSize;
    const pageHeight = pageSize.height || pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
        20,
        pageHeight - 10
      );
      doc.text('VitalSync Health Hub', 150, pageHeight - 10);
    }
  }

  async exportToPDF(data: ExportData): Promise<void> {
    try {
      const doc = new jsPDF();
      
      // Add header
      this.addHeader(doc);
      
      let yPos = 45;
      
      // Add user information
      yPos = this.addUserInfo(doc, data.profile, yPos);
      
      // Add BMI information
      if (data.bmi && data.bmiCategory) {
        yPos = this.addBMIInfo(doc, data.bmi, data.bmiCategory, yPos);
      }
      
      // Add prediction results
      if (data.prediction || data.confidence || data.probabilities || data.estimatedHbA1c) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }
        yPos = this.addPredictionResults(
          doc,
          data.prediction,
          data.confidence,
          data.probabilities,
          data.estimatedHbA1c,
          yPos
        );
      }
      
      // Add reminders
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      yPos = this.addReminders(doc, data.reminders, yPos);
      
      // Add glucose readings
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      yPos = this.addGlucoseReadings(doc, data.glucoseReadings, yPos);
      
      // Add footer
      this.addFooter(doc);
      
      // Save the PDF
      const fileName = `VitalSync_Report_${data.profile.firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      console.log('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Failed to export PDF');
    }
  }
}

export const pdfExportService = new PDFExportService();