<!doctype html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Admission Form 2026-27 | Suraj English Academy</title>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>

<style>
.step{display:none;}
.step.active{display:block;}
</style>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-9V6F88M18Q"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-9V6F88M18Q');
</script>
</head>

<body class="bg-gray-50">

<!-- NAVBAR -->
<nav class="bg-white shadow-md">
<div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">

<div class="flex items-center space-x-3">
<img src="images/logo.png" class="w-10 h-10">
<div>
<h1 class="font-bold text-green-700">Suraj English Academy</h1>
<p class="text-sm text-green-600">Palanpur</p>
</div>
</div>

<a href="index.html" class="bg-green-600 text-white px-4 py-2 rounded-xl">
Home
</a>

</div>
</nav>


<!-- FORM SECTION -->
<section id="formSection" class="py-16">

<div class="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-8">

<h2 class="text-3xl font-bold text-center mb-8">
Admission Form 2026-27
</h2>

<form id="admissionForm" class="space-y-6">

<!-- STEP 1 -->

<div class="step active">

<h3 class="text-xl font-semibold mb-6">Student Details</h3>

<label class="block mb-1 font-medium">Course *</label>
<select name="Course" required class="border p-3 rounded-xl w-full mb-6">
<option value="">Select Course</option>
<option>Std. 8 (English Medium)</option>
<option>Std. 8 (Gujarati Medium)</option>
<option>Std. 9 (Gujarati Medium)</option>
<option>Std. 10 (Gujarati Medium)</option>
</select>

<div class="grid md:grid-cols-3 gap-4">

<div>
<label class="text-sm">Surname *</label>
<input type="text" name="Student Surname" required oninput="capitalizeText(this)" class="border p-3 rounded-xl w-full">
</div>

<div>
<label class="text-sm">Student Name *</label>
<input type="text" name="Student Name" required oninput="capitalizeText(this)" class="border p-3 rounded-xl w-full">
</div>

<div>
<label class="text-sm">Last Name *</label>
<input type="text" name="Student Last Name" required oninput="capitalizeText(this)" class="border p-3 rounded-xl w-full">
</div>

</div>

<button type="button" onclick="validateStep1()" class="mt-6 bg-orange-500 text-white px-6 py-3 rounded-xl">
Next
</button>

</div>


<!-- STEP 2 -->

<div class="step">

<h3 class="text-xl font-semibold mb-6">Personal Details</h3>

<label class="text-sm">Date of Birth *</label>
<input type="date" name="DOB" required min="2007-01-01" max="2014-12-31"
class="border p-3 rounded-xl w-full mb-4">

<label class="text-sm">School *</label>
<input type="text" name="School" required oninput="capitalizeText(this)"
class="border p-3 rounded-xl w-full mb-6">

<button type="button" onclick="prevStep()" class="bg-gray-300 px-4 py-2 rounded-xl">
Previous
</button>

<button type="button" onclick="validateStep2()" class="bg-orange-500 text-white px-6 py-3 rounded-xl">
Next
</button>

</div>


<!-- STEP 3 -->

<div class="step">

<h3 class="text-xl font-semibold mb-6">Contact Details</h3>

<label class="text-sm">Mobile Number *</label>
<input type="tel" name="Mobile Number" required pattern="[0-9]{10}" maxlength="10"
class="border p-3 rounded-xl w-full mb-4">

<label class="text-sm">Alternative Mobile Number</label>
<input type="tel" name="Alternative Mobile Number"
pattern="[0-9]{10}" maxlength="10"
class="border p-3 rounded-xl w-full mb-4">

<label class="text-sm">WhatsApp Number *</label>
<input type="tel" name="Whatsapp Number" required pattern="[0-9]{10}" maxlength="10"
class="border p-3 rounded-xl w-full mb-4">

<label class="text-sm">Email *</label>
<input type="email" name="Email ID" required
class="border p-3 rounded-xl w-full mb-4">

<label class="text-sm">Address *</label>
<textarea name="Address" required oninput="capitalizeText(this)"
class="border p-3 rounded-xl w-full mb-6"></textarea>

<button type="button" onclick="prevStep()" class="bg-gray-300 px-4 py-2 rounded-xl">
Previous
</button>

<button type="submit" class="bg-orange-500 text-white px-6 py-3 rounded-xl">
Submit
</button>

</div>

</form>
</div>
</section>


<!-- SUCCESS PAGE -->

<section id="successSection" class="hidden flex items-center justify-center min-h-screen">

<div class="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md">

<div class="text-green-500 text-6xl mb-4">✔</div>

<h1 class="text-3xl font-bold text-green-600 mb-3">
Admission Successful!
</h1>

<p class="text-gray-600 mb-6">
Your admission form has been submitted successfully.
</p>

<p class="text-lg font-semibold mb-6">
Course: <span id="courseName"></span>
</p>

<div class="flex flex-col gap-3">

<a id="whatsappBtn"
class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold inline-block">
Join WhatsApp Group
</a>

<button onclick="downloadReceiptPDF()" class="bg-blue-600 text-white px-6 py-3 rounded-xl">
Download Admission Receipt (PDF)
</button>

</div>

</div>
</section>


<script>

let currentStep=0;
const steps=document.querySelectorAll(".step");

function showStep(step){
steps.forEach((s,i)=>s.classList.toggle("active",i===step));
}

function nextStep(){
currentStep++;
showStep(currentStep);
}

function prevStep(){
currentStep--;
showStep(currentStep);
}

function validateStep1(){
const step=steps[0];
const inputs=step.querySelectorAll("input,select");
for(let i of inputs){
if(!i.checkValidity()){
i.reportValidity();
return;
}
}
nextStep();
}

function validateStep2(){
const step=steps[1];
const inputs=step.querySelectorAll("input");
for(let i of inputs){
if(!i.checkValidity()){
i.reportValidity();
return;
}
}
nextStep();
}

function capitalizeText(el){
el.value=el.value.toUpperCase();
}

function calcAge(dob){

const birth=new Date(dob);
const today=new Date();

let age=today.getFullYear()-birth.getFullYear();
const m=today.getMonth()-birth.getMonth();

if(m<0 || (m===0 && today.getDate()<birth.getDate())){
age--;
}

return age;

}

</script>



<!-- FIREBASE -->

<script type="module">

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyACOURK_ZQEuxuZqP5Xfv_lZ29Nj59uHj8",
authDomain: "suraj-english-academy-7141e.firebaseapp.com",
projectId: "suraj-english-academy-7141e",
storageBucket: "suraj-english-academy-7141e.firebasestorage.app",
messagingSenderId: "291322319555",
appId: "1:291322319555:web:9ad5bb47e56ee27b9dc876"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form=document.getElementById("admissionForm");

form.addEventListener("submit", async function(e){

e.preventDefault();

const name=form["Student Name"].value;
const mobile=form["Mobile Number"].value;

const q=query(collection(db,"admissions"),where("name","==",name),where("mobile","==",mobile));
const check=await getDocs(q);

if(!check.empty){
alert("This student already submitted the form.");
return;
}

const all=await getDocs(collection(db,"admissions"));
const admissionNo="SEA_202627_"+String(all.size+1).padStart(3,"0");

const course=form["Course"].value;

const studentData={

admissionNo:admissionNo,
course:course,
surname:form["Student Surname"].value,
name:name,
lastname:form["Student Last Name"].value,
dob:form["DOB"].value,
school:form["School"].value,
mobile:mobile,
altmobile:form["Alternative Mobile Number"].value,
whatsapp:form["Whatsapp Number"].value,
email:form["Email ID"].value,
address:form["Address"].value,
createdAt:new Date()

};

await addDoc(collection(db,"admissions"),studentData);

window.submittedStudent=studentData;

document.getElementById("formSection").style.display="none";
document.getElementById("successSection").classList.remove("hidden");
document.getElementById("courseName").innerText=course;

/* SET WHATSAPP GROUP LINK BASED ON COURSE */

let groupLink = "";

if(course.includes("Std. 8")){
groupLink = "https://chat.whatsapp.com/Ey3oS75X7eABknDHm74y67";
}
else if(course.includes("Std. 9")){
groupLink = "https://chat.whatsapp.com/GArHkvW6DyaKTBN8JOfn5y";
}
else if(course.includes("Std. 10")){
groupLink = "https://chat.whatsapp.com/BnE9rBlh99M248TwypftMt";
}

document.getElementById("whatsappBtn").href = groupLink;

confetti({particleCount:150,spread:70,origin:{y:0.6}});

});

window.downloadReceiptPDF=function(){

const { jsPDF } = window.jspdf;
const s = window.submittedStudent;
const age = calcAge(s.dob);

/* QR CODE DATA = ONLY ADMISSION NUMBER */

QRCode.toDataURL("https://surajenglishacademy.in/verify.html?id="+s.admissionNo, function (err, qrImage) {

const doc = new jsPDF();

doc.setFontSize(18);
doc.text("Suraj English Academy",105,20,null,null,"center");

doc.setFontSize(12);
doc.text("Palanpur",105,27,null,null,"center");

doc.text("Admission Form 2026-27",105,35,null,null,"center");

doc.setFontSize(11);

let y=50;

doc.text("Admission No:",20,y);
doc.text(s.admissionNo,80,y);

y+=10;
doc.text("Student Name:",20,y);
doc.text(s.surname+" "+s.name+" "+s.lastname,80,y);

y+=10;
doc.text("Course:",20,y);
doc.text(s.course,80,y);

y+=10;
doc.text("Date of Birth:",20,y);
doc.text(s.dob,80,y);

y+=10;
doc.text("Age:",20,y);
doc.text(String(age),80,y);

y+=10;
doc.text("School:",20,y);
doc.text(s.school,80,y);

y+=10;
doc.text("Mobile:",20,y);
doc.text(s.mobile,80,y);

y+=10;
doc.text("WhatsApp:",20,y);
doc.text(s.whatsapp,80,y);

y+=10;
doc.text("Address:",20,y);
doc.text(s.address,80,y);

/* QR CODE */

doc.addImage(qrImage,"PNG",150,45,40,40);

doc.setFontSize(9);
doc.text("Scan QR to verify admission",150,90);

y+=30;

doc.setTextColor(0,150,0);
doc.setFontSize(20);
doc.text("ADMITTED",105,y,null,null,"center");

y+=10;

doc.setFontSize(10);
doc.setTextColor(100);

doc.text(
"This is a computer generated admission receipt. No signature required.",
105,
y,
null,
null,
"center"
);

doc.save(s.admissionNo+".pdf");

});

}
</script>

</body>
</html>
