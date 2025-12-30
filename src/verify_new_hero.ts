import { createRazorHero, RAZOR_HERO } from './data/HeroProgression';

console.log("--- VERIFYING NEW HERO: RAZOR ---");

const razorManager = createRazorHero(1);
const statsLvl1 = razorManager.getCurrentStats();

console.log(`[LEVEL 1 STATS]`);
console.log(`HP: ${statsLvl1.hp} (Expected 550) -> ${statsLvl1.hp === 550 ? 'OK' : 'FAIL'}`);
console.log(`ATK: ${statsLvl1.atk} (Expected 48) -> ${statsLvl1.atk === 48 ? 'OK' : 'FAIL'}`);

const razorManagerMax = createRazorHero(250);
const statsLvl250 = razorManagerMax.getCurrentStats();

console.log(`\n[LEVEL 250 STATS]`);
console.log(`HP: ${statsLvl250.hp} (Expected 155000) -> ${statsLvl250.hp === 155000 ? 'OK' : 'FAIL'}`);
console.log(`ATK: ${statsLvl250.atk} (Expected 16500) -> ${statsLvl250.atk === 16500 ? 'OK' : 'FAIL'}`);

console.log(`\n[SKILL VERIFICATION]`);
const skills = razorManager.config.skills;
console.log(`Skill Count: ${skills.length} (Expected 4) -> ${skills.length === 4 ? 'OK' : 'FAIL'}`);
console.log(`Skill 1: ${skills[0].id} (${skills[0].name})`);
console.log(`Skill 2: ${skills[1].id} (${skills[1].name})`);
console.log(`Skill 3: ${skills[2].id} (${skills[2].name})`);
console.log(`Ultimate: ${skills[3].id} (${skills[3].name})`);

console.log("\n--- VERIFICATION COMPLETE ---");
