



import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
// Fix: The following Firebase imports have been updated to use scoped packages (@firebase/*)
// to resolve module export errors, which can occur if the Firebase SDK was installed
// as individual components rather than the main 'firebase' package.
import { initializeApp } from '@firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from '@firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    onSnapshot, 
    collection, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    deleteField
} from '@firebase/firestore';

// GameState Constants
const GameState = Object.freeze({
    Home: 0,
    SoloSetup: 1,
    CreateGameSetup: 2,
    JoinGameSetup: 3,
    Lobby: 4,
    InGame: 5,
    Results: 6,
    TeacherDashboard: 7,
    SentenceBuilder: 8,
});

// Writing Category Constants
const WritingCategory = Object.freeze({
    Narrative: "Narrative",
    Persuasive: "Persuasive",
    Informative: "Informative",
    Editing: "Editing",
});

// Word & Prompt Constants
const NARRATIVE_PROMPTS = [
    { category: "Mystery & Discovery", text: "My fingers closed around a smooth, cool stone in the riverbed. It wasn't just any rock; it was pounamu, carved in a perfect spiral. As I lifted it out of the water, the stone grew strangely warm in my hand, and a deep, pulsing hum vibrated up my arm." },
    { category: "Mystery & Discovery", text: "The old bach at the end of the beach had been empty for years. But one night during a storm, I saw a light flickering in the window. I crept closer, wiped the salty spray from the glass, and peered inside. The room was empty, but sitting on the table was a single, steaming cup of tea." },
    { category: "Mystery & Discovery", text: "No one ever went into the old sports shed; Mr. Henderson kept it locked. But as I chased a stray netball, I saw the padlock was broken, lying on the grass. I nudged the door open with my foot, revealing a set of dusty stairs leading down into pure darkness." },
    { category: "Mystery & Discovery", text: "While helping Dad in the garden, my spade hit something hard. It wasn't a rock. I dug around it and pulled out a rusty metal box. It was locked, but there was a strange symbol carved on the lid, the same symbol I'd seen on the old statue in the park." },
    { category: "Mystery & Discovery", text: "I found an old key in the pocket of a second-hand coat. It didn't look like a normal house key. It was ornate and heavy. I wonder what it unlocks..." },
    { category: "Mystery & Discovery", text: "A message in a bottle washed up on the shore. The paper was old and the writing was faded, but I could just make out the words: 'Help me, I'm trapped on...'" },
    { category: "Adventure & Action", text: "'Stay on the track!' our teacher yelled. I just stepped off the path for a second to see a cool fungus. When I looked up, the rest of my school camp group had vanished. I called out, but the only reply was the call of a distant morepork, even though it was the middle of the day." },
    { category: "Adventure & Action", text: "The rugby ball soared high into the air. I leaped, my fingers stretching, ready for the winning catch. But just as I was about to grab it, a cheeky pīwakawaka swooped down and pecked the ball, sending it spinning in a completely different direction." },
    { category: "Adventure & Action", text: "The ground started to shake violently. I grabbed onto the nearest tree as a huge crack appeared in the earth, revealing a glowing cave below." },
    { category: "Adventure & Action", text: "I was kayaking down a calm river when the current suddenly picked up speed. I was being pulled towards a waterfall I didn't know existed!" },
    { category: "Fantasy & Sci-Fi", text: "My koro always told stories about the taniwha in the river. I thought he was just joking. But when I dropped my jandal in the water, a huge, scaly head with glowing red eyes rose from the rapids. It wasn't looking at my jandal; it was looking right at me." },
    { category: "Fantasy & Sci-Fi", text: "I was drawing in my notebook when my pencil started to move on its own. It wasn't just scribbling; it was drawing a map. A map that showed a secret door hidden somewhere inside my own school." },
    { category: "Fantasy & Sci-Fi", text: "One morning, I woke up and found that everything in my room was floating. My bed, my toys, even my cat was gently bumping against the ceiling, looking very confused. I tried to stand up, and my feet lifted right off the floor." },
    { category: "Fantasy & Sci-Fi", text: "I planted a strange seed I found in the forest. Overnight, it grew into a towering beanstalk that disappeared into the clouds." },
    { category: "Fantasy & Sci-Fi", text: "A small, friendly robot appeared at my door. It held up a sign that read: 'I am lost. Can you help me find my way back to the year 2099?'" },
    { category: "Real-Life & Emotional", text: "The moving van was packed. This was my last look at my old house. I waved goodbye to the pōhutukawa tree I used to climb and got in the car. As we drove past the dairy for the last time, I saw my best friend, Hemi, sprinting after the car, yelling and waving a small box I had never seen before." },
    { category: "Real-Life & Emotional", text: "It was my turn to speak in front of the whole school assembly. My knees were knocking together and my palms were sweaty. I took a deep breath, looked at my best friend in the crowd, and opened my mouth to..." },
    { category: "Real-Life & Emotional", text: "My first day at a new school. I didn't know anyone. As I walked into the playground, a ball rolled towards my feet..." },
    { category: "Real-Life & Emotional", text: "I worked for weeks to save up for a new bike. The day I finally bought it, I