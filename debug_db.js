import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "existence-ticker"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const wishesRef = collection(db, "wishes");
  const snap = await getDocs(wishesRef);
  let found = false;
  snap.docs.forEach(doc => {
    console.log(doc.id, "=>", doc.data().status, "helper:", doc.data().helper_id, "applicants:", doc.data().applicant_ids);
    found = true;
  });
  if (!found) console.log("No wishes found");
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
