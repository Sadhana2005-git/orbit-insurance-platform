from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import io

class PolicyPDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
   
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
       
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#283593'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
   
    def generate_policy_pdf(self, policy_data, user_data, plan_data):
        """
        Generate insurance policy PDF
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                               rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=18)
       
        story = []
       
        # Header
        story.append(Paragraph("ORBIT INSURANCE", self.styles['CustomTitle']))
        story.append(Paragraph("Policy Document", self.styles['Heading2']))
        story.append(Spacer(1, 0.3*inch))
       
        # Policy Details
        policy_info = [
            ['Policy Number:', policy_data['policy_number']],
            ['Policy Status:', policy_data['status']],
            ['Issue Date:', datetime.now().strftime('%d-%b-%Y')],
            ['Policy Start Date:', policy_data['start_date']],
            ['Policy End Date:', policy_data['end_date']],
        ]
       
        story.append(Paragraph("Policy Information", self.styles['CustomHeading']))
        policy_table = Table(policy_info, colWidths=[2.5*inch, 3.5*inch])
        policy_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8eaf6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        story.append(policy_table)
        story.append(Spacer(1, 0.3*inch))
       
        # Insured Details
        insured_info = [
            ['Full Name:', user_data['full_name']],
            ['Date of Birth:', user_data['date_of_birth']],
            ['Email:', user_data['email']],
            ['Phone:', user_data['phone']],
            ['Address:', f"{user_data['city']}, {user_data['state']} - {user_data['pincode']}"],
        ]
       
        story.append(Paragraph("Insured Person Details", self.styles['CustomHeading']))
        insured_table = Table(insured_info, colWidths=[2.5*inch, 3.5*inch])
        insured_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8eaf6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        story.append(insured_table)
        story.append(Spacer(1, 0.3*inch))
       
        # Plan Details
        plan_info = [
            ['Insurance Provider:', plan_data['provider_name']],
            ['Plan Name:', plan_data['plan_name']],
            ['Plan Type:', plan_data['plan_type']],
            ['Sum Assured:', f"₹ {policy_data['coverage_amount']:,.2f}"],
            ['Premium Amount:', f"₹ {policy_data['premium_amount']:,.2f}"],
            ['Payment Frequency:', policy_data['payment_frequency']],
            ['Policy Term:', f"{plan_data['policy_term']} years"],
        ]
       
        story.append(Paragraph("Plan Details", self.styles['CustomHeading']))
        plan_table = Table(plan_info, colWidths=[2.5*inch, 3.5*inch])
        plan_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8eaf6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        story.append(plan_table)
        story.append(Spacer(1, 0.3*inch))
       
        # Nominee Details
        if policy_data.get('nominee_name'):
            nominee_info = [
                ['Nominee Name:', policy_data['nominee_name']],
                ['Relationship:', policy_data['nominee_relationship']],
            ]
           
            story.append(Paragraph("Nominee Details", self.styles['CustomHeading']))
            nominee_table = Table(nominee_info, colWidths=[2.5*inch, 3.5*inch])
            nominee_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8eaf6')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            story.append(nominee_table)
            story.append(Spacer(1, 0.3*inch))
       
        # Features and Benefits
        story.append(Paragraph("Key Features", self.styles['CustomHeading']))
        story.append(Paragraph(plan_data['features'], self.styles['BodyText']))
        story.append(Spacer(1, 0.2*inch))
       
        story.append(Paragraph("Benefits", self.styles['CustomHeading']))
        story.append(Paragraph(plan_data['benefits'], self.styles['BodyText']))
        story.append(Spacer(1, 0.2*inch))
       
        # Terms and Conditions
        story.append(Paragraph("Important Notes", self.styles['CustomHeading']))
        terms = """
        1. This policy is subject to terms and conditions mentioned in the policy document.<br/>
        2. Premium must be paid on time to keep the policy active.<br/>
        3. Free look period of 15 days is available from the date of receipt of policy.<br/>
        4. Please read all exclusions carefully.<br/>
        5. For claims, contact the insurance provider directly.<br/>
        6. This is a computer-generated document and does not require a signature.
        """
        story.append(Paragraph(terms, self.styles['BodyText']))
        story.append(Spacer(1, 0.3*inch))
       
        # Footer
        footer_text = f"""
        <para align=center>
        <b>ORBIT Insurance Platform</b><br/>
        Digital Insurance Solutions<br/>
        For queries: support@orbitinsurance.com | +91-1800-XXX-XXXX<br/>
        Generated on: {datetime.now().strftime('%d-%b-%Y %H:%M:%S')}
        </para>
        """
        story.append(Paragraph(footer_text, self.styles['BodyText']))
       
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
