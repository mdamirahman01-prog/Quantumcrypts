import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  query, 
  limit 
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { WelcomeMessage, Notice, FormField } from '../types';
import { handleFirestoreError, OperationType } from './firebase';

const DEFAULT_WELCOME_MESSAGES: Omit<WelcomeMessage, 'id'>[] = [
  { message: "Welcome to the First Cyber Security Engineering Department of Bangladesh. 🇧🇩", enabled: true, createdAt: Date.now() - 1000 },
  { message: "Congratulations! Thousands dreamed of this journey. Today, you're one step closer to becoming a Cyber Security Engineer.", enabled: true, createdAt: Date.now() - 2000 },
  { message: "The Future Doesn't Need More Users. It Needs Protectors.", enabled: true, createdAt: Date.now() - 3000 },
  { message: "Every Great Hacker Knows One Rule... Knowledge is the Ultimate Weapon.", enabled: true, createdAt: Date.now() - 4000 },
  { message: "Your Mission Starts Here. Secure. Defend. Innovate.", enabled: true, createdAt: Date.now() - 5000 },
  { message: "The Next Cyber Warrior Could Be You.", enabled: true, createdAt: Date.now() - 6000 },
  { message: "Not Everyone Gets Here. Congratulations on Joining Cyber Security Engineering.", enabled: true, createdAt: Date.now() - 7000 },
  { message: "Firewalls Can Stop Attacks. Brilliant Minds Prevent Them.", enabled: true, createdAt: Date.now() - 8000 },
  { message: "Think Like a Hacker. Defend Like a Guardian.", enabled: true, createdAt: Date.now() - 9000 },
  { message: "Welcome to a Department Where Curiosity Becomes Power.", enabled: true, createdAt: Date.now() - 10000 },
  { message: "Every Line of Code You Write Can Protect Millions.", enabled: true, createdAt: Date.now() - 11000 },
  { message: "This Is More Than a Department. This Is the Beginning of a Mission.", enabled: true, createdAt: Date.now() - 12000 },
  { message: "Cyber Space Never Sleeps... Neither Do Its Guardians.", enabled: true, createdAt: Date.now() - 13000 },
  { message: "Your Keyboard Is Now Your Greatest Weapon. Use It Wisely.", enabled: true, createdAt: Date.now() - 14000 },
  { message: "Dream Big. Learn Deep. Hack Ethically. Lead Fearlessly.", enabled: true, createdAt: Date.now() - 15000 },
  { message: "Today's Student. Tomorrow's Cyber Security Expert.", enabled: true, createdAt: Date.now() - 16000 },
  { message: "The Digital Battlefield Awaits. Are You Ready?", enabled: true, createdAt: Date.now() - 17000 },
  { message: "Every Expert Was Once a Beginner. Welcome to Your First Step.", enabled: true, createdAt: Date.now() - 18000 }
];

const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: "full_name", label: "Full Name", type: "text", required: true, placeholder: "e.g., Amir Mahmood", order: 0 },
  { id: "student_id", label: "Student ID / GST Roll Number", type: "text", required: true, placeholder: "e.g., GST-104523", order: 1 },
  { id: "department", label: "Department / Specialization", type: "dropdown", required: true, options: ["Cyber Security Engineering", "Computer Science", "Information Technology", "Other"], order: 2 },
  { id: "batch", label: "Batch / Intake Year", type: "number", required: true, placeholder: "e.g., 2026", order: 3 },
  { id: "phone", label: "Phone Number", type: "phone", required: true, placeholder: "e.g., +880 1712 345678", order: 4 },
  { id: "email", label: "Email Address", type: "email", required: true, placeholder: "e.g., user@example.com", order: 5 },
  { id: "blood_group", label: "Blood Group", type: "dropdown", required: false, options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], order: 6 },
  { id: "github_profile", label: "GitHub Profile URL", type: "text", required: false, placeholder: "https://github.com/yourusername", order: 7 },
  { id: "linkedin_profile", label: "LinkedIn Profile URL", type: "text", required: false, placeholder: "https://linkedin.com/in/yourusername", order: 8 },
  { id: "terms", label: "I agree to abide by the ethical code of the community", type: "checkbox", required: true, order: 9 }
];

export async function seedDatabaseIfEmpty(db: Firestore) {
  try {
    // 1. Check if welcome messages exist or need update
    const welRef = collection(db, 'welcome_messages');
    const welDocsSnap = await getDocs(welRef);
    const firstDoc = welDocsSnap.docs[0]?.data();
    
    // Seed if empty OR if the messages in the DB are old/mock or don't match our Bangladesh Cyber Department quotes
    const messagesCount = welDocsSnap.size;
    const hasBangladeshGreeting = welDocsSnap.docs.some(d => d.data().message?.includes('Bangladesh'));
    const isMock = !hasBangladeshGreeting || messagesCount < 15;

    if (welDocsSnap.empty || isMock) {
      console.log('Seeding default welcome messages...');
      const batch = writeBatch(db);
      
      // Clean up old mock messages if they exist
      welDocsSnap.forEach((d) => {
        batch.delete(d.ref);
      });

      DEFAULT_WELCOME_MESSAGES.forEach((msg) => {
        const newDocRef = doc(collection(db, 'welcome_messages'));
        batch.set(newDocRef, msg);
      });
      await batch.commit();
    }

    // 2. Clear existing senior messages to remove all demo/mock data
    const senRef = collection(db, 'senior_messages');
    const senDocsSnap = await getDocs(senRef);
    if (!senDocsSnap.empty) {
      console.log('Purging senior messages as section is fully removed...');
      const batch = writeBatch(db);
      senDocsSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // 4. Check if form fields exist
    const fieldsRef = collection(db, 'form_fields');
    const fieldsSnap = await getDocs(query(fieldsRef, limit(1)));
    if (fieldsSnap.empty) {
      console.log('Seeding default form fields...');
      const batch = writeBatch(db);
      DEFAULT_FORM_FIELDS.forEach((field) => {
        const newDocRef = doc(db, 'form_fields', field.id);
        batch.set(newDocRef, field);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    handleFirestoreError(error, OperationType.WRITE, 'seed_database');
  }
}
