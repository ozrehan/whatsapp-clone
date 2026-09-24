"use strict";
window.W = window.W || {};

/* ---------- reply helpers ---------- */
W.pick = function(arr){ return arr[Math.floor(Math.random()*arr.length)]; };

W.FALLBACKS = [
  "haha nice 😄",
  "okay okay",
  "fr tho",
  "lol exactly",
  "say less 😎",
  "bet 👍",
  "interesting... tell me more",
  "no way 😂",
  "that's actually cool",
  "on my way, 5 mins"
];

/* ---------- bot brain: contextual replies per chat ----------
   returns a string for DMs, {from, text} for groups */
W.brain = function(chat, userText){
  const t = String(userText || "").toLowerCase();
  const has = (...ws) => ws.some(w => t.includes(w));
  const groupReply = (pools) => {
    const who = W.pick(chat.participants);
    return {from: who, text: W.pick(pools[who])};
  };

  if(chat.id === "priya"){
    if(has("book","ticket","7")) return "booked! row F, aisle seats 🎟️";
    if(has("dune","movie","watch","trailer","imax")) return "the popcorn better be extra buttery 🍿";
    if(has("pizza","food","biryani","dinner","lunch")) return "extra cheese or we riot 🧀";
    if(has("?")) return "hmm let me check and tell you";
    return W.pick(["yesss","haha exactly","ok done 😌","see you at 7!","can't wait!!"]);
  }

  if(chat.id === "family"){
    return groupReply({
      Amma:["ok beta ❤️","take care, eat on time","god bless you","did you eat?"],
      Appa:["noted.","call your uncle too","drive safe","we will discuss on Sunday"],
      Sneha:["lol 😂","omg finally","+1","amma he's blushing"]
    });
  }

  if(chat.id === "arjun"){
    if(has("cricket","match","kohli","six","four","wicket","final","rcb","ipl")) return "that six over long-on though 🔥";
    if(has("snack","chips","biryani","food")) return "chips and cold drinks, sorted 🥤";
    if(has("gym","workout")) return "leg day tomorrow. no excuses this time";
    if(has("fifa","game")) return "rematch. loser buys biryani, as always";
    if(has("?")) return "my place, 6:30. don't be late this time";
    return W.pick(["for real","let's gooo","haha true","brooo exactly"]);
  }

  if(chat.id === "nova"){
    if(has("standup","meeting","sync")) return groupReply({
      Rahul:["standup in 10, don't be late 👀","let's take this offline after standup","noted, adding to the agenda"],
      Neha:["on the call already","sharing my screen in 2","standup notes are up"],
      Vikram:["joining in 5","wrapping up the auth PR first","on my way"]
    });
    if(has("deploy","staging","prod","green")) return groupReply({
      Rahul:["deploy pipeline is all green ✅","shipping it","client will love this"],
      Neha:["deploy pipeline is happy today 🟢","just pushed to staging","no rollbacks this time 🤞"],
      Vikram:["watching the ci like a hawk 👀","all checks passed","merging now"]
    });
    if(has("bug","fix","error","broken")) return groupReply({
      Rahul:["ticket created, p1","who broke staging?? 👀","let's pair on this after lunch"],
      Neha:["reproducing it now","looks like a race condition","fix is up for review"],
      Vikram:["on it, checking logs","found it. pushing fix in 10","classic off-by-one"]
    });
    if(has("demo","client")) return groupReply({
      Rahul:["client demo moved to Thursday btw","deck is ready, review please","they loved the prototype 🎉"],
      Neha:["metrics slide is updated 📊","demo env is stable","recording a backup demo just in case"],
      Vikram:["auth flow is demo-ready","hiding the unfinished bits 😅","all good on my side"]
    });
    return groupReply({
      Rahul:["noted, updating the board ✅","let's sync after standup","client will love this"],
      Neha:["deploy pipeline is happy today 🟢","I'll take the frontend bits","+1 to that"],
      Vikram:["auth PR is ready for review 👀","on it, pushing in 10","nice catch"]
    });
  }

  if(chat.id === "mom"){
    if(has("eat","food","dinner","lunch","breakfast")) return W.pick(["did you eat properly?","don't skip meals beta","eat fruits also 🍎"]);
    if(has("call")) return "call me tonight beta ❤️";
    if(has("?")) return "ok, take care";
    return W.pick(["ok take care ❤️","call me tonight","don't forget your jacket","god bless you beta"]);
  }

  if(chat.id === "college"){
    if(has("goa","trip","flight","villa","beach")) return groupReply({
      Farhan:["goa is happeningggg 🏖️","adding it to the sheet 📝","budget mode: ON"],
      Divya:["already checking airbnbs 🏠","december can't come sooner","packing list incoming"],
      Zoya:["5th-9th works for me ✅","count me in!","window seat is mine"],
      Kiran:["saw return flights at 4.2k","book before prices jump ✈️","splitting costs 4 ways?"]
    });
    return groupReply({
      Farhan:["ok adding it to the sheet 📝","goa is happeningggg","budget mode: ON"],
      Divya:["already checking airbnbs 🏠","december can't come sooner","packing list incoming"],
      Zoya:["5th-9th works for me ✅","count me in!","window seat is mine"],
      Kiran:["saw return flights at 4.2k","book before prices jump ✈️","splitting costs 4 ways?"]
    });
  }

  if(chat.id === "ravi"){
    if(has("diwali","plan","home")) return "coming home on the 28th, crackers ready 🪔";
    if(has("cricket","match","turf")) return "sunday 6am turf. don't bail this time";
    if(has("job","work")) return "building apps and breaking prod, the usual 😎";
    return W.pick(["haha","true true","we should catch up soon","brooo"]);
  }

  if(chat.id === "sneha"){
    if(has("resume","cv")) return "you're the best 🥺";
    if(has("mumbai","interview","secret","amma")) return "your secret's safe with me 🤫 good luck!!";
    if(has("?")) return "hmm, let me think...";
    return W.pick(["thanks rehan!","lol","okay","you always know what to say 🥺"]);
  }

  if(chat.id === "design"){
    if(has("figma","design","mockup","ui")) return groupReply({
      Meera:["figma file is updated ✨","check the new components","tokens are all synced"],
      Kabir:["the spacing finally feels right","micro-interactions done 🎞️","pushing the prototype link"],
      Tara:["love this direction","leaving comments in figma","moodboard updated"]
    });
    if(has("deadline","friday","urgent","asap")) return groupReply({
      Meera:["on it, screens by tonight","war room tomorrow 10am","we got this 💪"],
      Kabir:["pulling an all-nighter if needed","design system tokens first, then screens","deadline noted 😅"],
      Tara:["brief is locked, no more changes","final review at 4pm?","coffee IV drip activated ☕"]
    });
    if(has("client","feedback","review")) return groupReply({
      Meera:["client loved it!! 🎉","after 4 rounds of 'make it pop' 😭","presenting v3 tomorrow"],
      Kabir:["they said 'premium but approachable'","so... everything, basically","feedback addressed ✅"],
      Tara:["staging link sent to client","fingers crossed 🤞","they approved the hero!"]
    });
    return groupReply({
      Meera:["noted ✨","updating the file now","good catch!"],
      Kabir:["on it","lol exactly","nice, pushing in 10"],
      Tara:["+1","checking the brief","sounds good!"]
    });
  }

  if(chat.id === "gym"){
    if(has("workout","gym","lift","training")) return groupReply({
      Dev:["leg day done. can't feel my legs 🦵💀","new PR today 🏋️","eat. sleep. lift. repeat."],
      Nikhil:["6am tomorrow?","rest day today 😌","form > weight, always"]
    });
    if(has("protein","diet","food","eat","meal")) return groupReply({
      Dev:["protein powder is on sale, 2kg for 3.2k","meal prep sunday 🍗🥦","no more excuses"],
      Nikhil:["taste is for cheat days","chicken rice. again. 😤","bulking season"]
    });
    if(has("leg")) return groupReply({
      Dev:["never skip leg day 🦵","my quads are screaming","leg day survivor 💪"],
      Nikhil:["leg day is the best day","squats. now.","walk funny tomorrow, it's tradition"]
    });
    return groupReply({
      Dev:["let's gooo 💪","beast mode","see you at 6"],
      Nikhil:["in","bet","don't bail 😤"]
    });
  }

  if(chat.id === "aisha"){
    if(has("coffee","café","cafe","latte","chai")) return "third wave, saturday 4pm? ☕";
    if(has("photo","camera","shoot","picture")) return "golden hour shots this weekend? 📸";
    if(has("weekend","plan","saturday","sunday")) return "flea market at kitsch mandi? there's always good food";
    if(has("book","read")) return "finished 'the midnight library' yet??";
    if(has("?")) return "hmm, let me check and tell you!";
    return W.pick(["yesss","haha exactly","that's so cool","can't wait!!"]);
  }

  if(chat.id === "landlord"){
    if(has("rent","pay","transfer","upi")) return "Rent received. Thank you.";
    if(has("repair","leak","plumber","tap","fix","maintenance")) return "I will send someone to look at it. Please keep the flat accessible.";
    if(has("agreement","sign","document")) return "Please sign and return one copy at the earliest.";
    if(has("?")) return "Noted. I will get back to you.";
    return W.pick(["Noted.","Thank you.","I will arrange it.","Please inform me in advance next time."]);
  }

  if(chat.id === "bookclub"){
    if(has("book","read","novel","author")) return groupReply({
      Sneha:["just finished it. 9/10 😭","my tbr pile is judging me 📚","adding to my list!"],
      Divya:["already 100 pages in","this one's a page-turner","library sale at blossoms tomorrow!"],
      Rohan:["hot take incoming...","currently on 'project hail mary' 🚀","i'm picking next month's book"]
    });
    if(has("meet","sunday","meetup","discuss")) return groupReply({
      Sneha:["sunday 4pm, third wave? 📚","i'll bring the discussion questions","can't wait!"],
      Divya:["in!","bringing snacks this time","see you all sunday"],
      Rohan:["i'll be 10 mins late, as usual","book swap after?","noted 📝"]
    });
    return groupReply({
      Sneha:["+1 📚","lol exactly","so true"],
      Divya:["agreed!","already checking","count me in"],
      Rohan:["noted","fair point","let's discuss sunday"]
    });
  }

  if(chat.id === "football"){
    if(has("match","game","score","goal","win")) return groupReply({
      Arjun:["what a match!! 🔥","90th minute winner!!","we're watching the final at my place"],
      Farhan:["that comeback though","adding the highlights to the group","unreal scenes"],
      Dev:["i screamed so loud my neighbor knocked 😂","man of the match: kiran","2 goals. all me. 😎"],
      Kiran:["all me. no big deal 😎","my assist though","team effort guys"]
    });
    if(has("turf","practice","sunday","training")) return groupReply({
      Arjun:["turf booked for sunday 7am ⚽","be there or be square","bringing the ball"],
      Farhan:["7am is inhumane but ok","in","need 2 more players"],
      Dev:["in. bringing my new boots","need to fix my free kicks 😤","practice thursday 6pm?"],
      Kiran:["asking in the society group","splitting the turf cost 5 ways?","in ✅"]
    });
    return groupReply({
      Arjun:["let's gooo ⚽","for real","brooo"],
      Farhan:["in","haha true","ok noted"],
      Dev:["beast mode 💪","see you sunday","bet"],
      Kiran:["+1","done ✅","sounds good"]
    });
  }

  if(chat.id === "oldproj"){
    return W.pick([
      "this group is archived 😅",
      "wrong chat? this project's done and dusted",
      "memories 🥲 but we're on nova now",
      "archived! ping me on the nova group",
      "haha this is a museum now"
    ]);
  }

  return W.pick(W.FALLBACKS);
};
