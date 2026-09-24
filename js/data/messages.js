"use strict";
window.W = window.W || {}; W.data = W.data || {};

/* ---------- message histories ----------
   attachMessages() fills chat.messages for every chat in W.data.chats.
   Histories run oldest → newest. The final messages of the 8 original
   chats match the original seed data so list snippets stay identical;
   older history is extended backwards across the week.
   Message shape: {id, from, text, time, day, sent, read, type,
     seed/caption (image), duration (voice), filename/size (doc),
     quote:{from,text}, starred} */
W.data.attachMessages = function(){
  var byId = {};
  W.data.chats.forEach(function(c){ byId[c.id] = c; });

  /* ----- Priya Sharma (dm) ----- */
  byId.priya.messages = [
  {
    id:"priya-m0", from:"Priya Sharma",
    time:"20:10", day:"saturday",
    text:"guess who finally watched interstellar"
  },
  {
    id:"priya-m1", from:"me", sent:true, read:true,
    time:"20:12", day:"saturday",
    text:"ONLY TOOK YOU 10 YEARS 😭"
  },
  {
    id:"priya-m2", from:"Priya Sharma",
    time:"20:15", day:"saturday",
    text:"the docking scene... i had to pause and breathe"
  },
  {
    id:"priya-m3", from:"me", sent:true, read:true,
    time:"20:18", day:"saturday",
    text:"told you! nolan is a menace"
  },
  {
    id:"priya-m4", from:"Priya Sharma", starred:true,
    time:"20:20", day:"saturday",
    text:"ok next: we watch dune together. no excuses"
  },
  {
    id:"priya-m5", from:"me", sent:true, read:true,
    time:"20:22", day:"saturday",
    text:"deal. imax or nothing"
  },
  {
    id:"priya-m6", from:"Priya Sharma",
    time:"10:05", day:"sunday",
    text:"brunch at third wave tomorrow? 11?"
  },
  {
    id:"priya-m7", from:"me", sent:true, read:true,
    time:"10:10", day:"sunday",
    text:"make it 11:30, gym in the morning 💪"
  },
  {
    id:"priya-m8", from:"Priya Sharma",
    time:"10:11", day:"sunday",
    text:"since when do you gym"
  },
  {
    id:"priya-m9", from:"me", sent:true, read:true,
    time:"10:12", day:"sunday",
    text:"since my jeans stopped fitting 🥲"
  },
  {
    id:"priya-m10", from:"Priya Sharma",
    time:"12:40", day:"monday", type:"image",
    seed:"priya-cafe-latte", caption:"this latte art is too pretty to drink ☕",
    text:"📷 this latte art is too pretty to drink ☕"
  },
  {
    id:"priya-m11", from:"me", sent:true, read:true,
    time:"12:45", day:"monday",
    text:"you drank it in 2 minutes last time"
  },
  {
    id:"priya-m12", from:"Priya Sharma",
    time:"12:46", day:"monday",
    text:"rude but accurate"
  },
  {
    id:"priya-m13", from:"me", sent:true, read:true,
    time:"19:30", day:"monday",
    text:"btw mom asked about you, said come home for lunch sunday"
  },
  {
    id:"priya-m14", from:"Priya Sharma",
    time:"19:35", day:"monday",
    text:"aww tell her i'm coming! i'll bring the gulab jamuns 🥰"
  },
  {
    id:"priya-m15", from:"Priya Sharma",
    time:"21:05", day:"tuesday",
    text:"heard the new arijit album? on loop all day"
  },
  {
    id:"priya-m16", from:"me", sent:true, read:true,
    time:"21:10", day:"tuesday",
    text:"sending you my playlist, it's better"
  },
  {
    id:"priya-m17", from:"Priya Sharma",
    time:"21:12", day:"tuesday",
    text:"your playlist is 90% gym bro edm"
  },
  {
    id:"priya-m18", from:"me", sent:true, read:true,
    time:"21:13", day:"tuesday",
    text:"and 10% pure taste"
  },
  {
    id:"priya-m19", from:"Priya Sharma",
    time:"21:15", day:"tuesday",
    quote:{from:"me", text:"deal. imax or nothing"},
    text:"holding you to this. dune 2 this weekend"
  },
  {
    id:"priya-m20", from:"Priya Sharma",
    time:"10:20", day:"yesterday",
    text:"standup done. this sprint is going to kill me"
  },
  {
    id:"priya-m21", from:"me", sent:true, read:true,
    time:"10:25", day:"yesterday",
    text:"same. coffee break at 4?"
  },
  {
    id:"priya-m22", from:"Priya Sharma",
    time:"10:26", day:"yesterday",
    text:"deal ☕"
  },
  {
    id:"priya-m23", from:"Priya Sharma",
    time:"17:20", day:"yesterday",
    text:"did you see the new dune trailer??"
  },
  {
    id:"priya-m24", from:"me", sent:true, read:true,
    time:"17:25", day:"yesterday",
    text:"NOT YET don't spoil anything"
  },
  {
    id:"priya-m25", from:"Priya Sharma",
    time:"17:26", day:"yesterday",
    text:"the sandworm scene 😭"
  },
  {
    id:"priya-m26", from:"me", sent:true, read:true,
    time:"17:40", day:"yesterday",
    text:"watching tonight, pizza is already ordered 🍕"
  },
  {
    id:"priya-m27", from:"Priya Sharma",
    time:"18:00", day:"today",
    text:"movie at 7? inox mantri square"
  },
  {
    id:"priya-m28", from:"Priya Sharma",
    time:"18:02", day:"today",
    text:"i'll book 2 tickets, aisle seats"
  }
  ];

  /* ----- Family ❤️ (group) ----- */
  byId.family.messages = [
  {
    id:"family-m0", from:"Sneha", starred:true,
    time:"16:00", day:"saturday",
    text:"guess who got shortlisted for the internship!!"
  },
  {
    id:"family-m1", from:"Amma",
    time:"16:05", day:"saturday",
    text:"mashallah beta! so proud ❤️"
  },
  {
    id:"family-m2", from:"Appa",
    time:"16:10", day:"saturday",
    text:"well done. which company?"
  },
  {
    id:"family-m3", from:"Sneha",
    time:"16:12", day:"saturday",
    text:"the fintech one in hsr!"
  },
  {
    id:"family-m4", from:"me", sent:true, read:true,
    time:"16:15", day:"saturday",
    text:"treat time 🍕"
  },
  {
    id:"family-m5", from:"Amma",
    time:"10:30", day:"sunday", type:"voice", duration:65,
    text:"🎤 voice message (1:05)"
  },
  {
    id:"family-m6", from:"me", sent:true, read:true,
    time:"10:45", day:"sunday",
    text:"ok amma, i'll call him in the evening"
  },
  {
    id:"family-m7", from:"Appa",
    time:"11:00", day:"sunday",
    text:"i am fine. she worries too much."
  },
  {
    id:"family-m8", from:"Sneha",
    time:"11:05", day:"sunday",
    text:"appa please just walk 😤"
  },
  {
    id:"family-m9", from:"Appa",
    time:"11:00", day:"monday",
    text:"sneha, your college fees receipt came"
  },
  {
    id:"family-m10", from:"Sneha",
    time:"11:05", day:"monday",
    text:"i'll collect it this weekend"
  },
  {
    id:"family-m11", from:"Amma",
    time:"18:00", day:"monday",
    text:"rehan, your cousin's wedding is next month, don't make plans"
  },
  {
    id:"family-m12", from:"me", sent:true, read:true,
    time:"18:05", day:"monday",
    text:"which cousin?"
  },
  {
    id:"family-m13", from:"Amma",
    time:"18:06", day:"monday",
    text:"farah's daughter. chennai."
  },
  {
    id:"family-m14", from:"Sneha",
    time:"18:08", day:"monday",
    text:"chennai in october = sauna 🥵"
  },
  {
    id:"family-m15", from:"me", sent:true, read:true,
    time:"18:10", day:"monday",
    text:"booked my leaves already, we're going"
  },
  {
    id:"family-m16", from:"Amma",
    time:"08:00", day:"tuesday", type:"image",
    seed:"amma-garden-roses", caption:"my roses finally bloomed 🌹",
    text:"📷 my roses finally bloomed 🌹"
  },
  {
    id:"family-m17", from:"Sneha",
    time:"08:05", day:"tuesday",
    text:"so pretty!!"
  },
  {
    id:"family-m18", from:"Appa",
    time:"08:10", day:"tuesday",
    text:"your mother talks to them more than to us"
  },
  {
    id:"family-m19", from:"Amma",
    time:"08:12", day:"tuesday",
    text:"at least the roses listen 🌹"
  },
  {
    id:"family-m20", from:"me", sent:true, read:true,
    time:"08:15", day:"tuesday",
    text:"😂😂"
  },
  {
    id:"family-m21", from:"Sneha",
    time:"08:16", day:"tuesday",
    text:"appa got roasted by amma, historic moment"
  },
  {
    id:"family-m22", from:"Amma",
    time:"21:30", day:"yesterday",
    text:"beta did you reach home safe?"
  },
  {
    id:"family-m23", from:"me", sent:true, read:true,
    time:"21:35", day:"yesterday",
    text:"yes amma, just reached"
  },
  {
    id:"family-m24", from:"Amma",
    time:"21:36", day:"yesterday",
    text:"good. eat something warm"
  },
  {
    id:"family-m25", from:"Amma",
    time:"09:12", day:"today",
    text:"rehan beta, call when you are free"
  },
  {
    id:"family-m26", from:"Sneha",
    time:"09:15", day:"today",
    text:"amma he's probably asleep 😴"
  },
  {
    id:"family-m27", from:"me", sent:true, read:true,
    time:"09:20", day:"today",
    text:"I'm awake! what's up"
  },
  {
    id:"family-m28", from:"Appa",
    time:"09:22", day:"today",
    text:"your uncle is visiting on Sunday, be home by 6"
  },
  {
    id:"family-m29", from:"me", sent:true, read:true,
    time:"09:23", day:"today",
    text:"ok will be there 👍"
  }
  ];

  /* ----- Arjun Mehta (dm) ----- */
  byId.arjun.messages = [
  {
    id:"arjun-m0", from:"Arjun Mehta",
    time:"12:00", day:"friday",
    text:"rcb jerseys are 40% off, ordering?"
  },
  {
    id:"arjun-m1", from:"me", sent:true, read:true,
    time:"12:05", day:"friday",
    text:"large for me"
  },
  {
    id:"arjun-m2", from:"Arjun Mehta",
    time:"12:10", day:"friday",
    text:"done ✅"
  },
  {
    id:"arjun-m3", from:"Arjun Mehta",
    time:"07:30", day:"saturday", type:"image",
    seed:"arjun-bike-ride", caption:"nandi hills ride done 🏍️💨",
    text:"📷 nandi hills ride done 🏍️💨"
  },
  {
    id:"arjun-m4", from:"me", sent:true, read:true,
    time:"09:00", day:"saturday",
    text:"next time i'm coming. no excuses"
  },
  {
    id:"arjun-m5", from:"Arjun Mehta",
    time:"09:05", day:"saturday",
    text:"you said that the last 4 times"
  },
  {
    id:"arjun-m6", from:"Arjun Mehta",
    time:"18:00", day:"sunday",
    text:"fifa night at mine saturday? loser buys biryani"
  },
  {
    id:"arjun-m7", from:"me", sent:true, read:true,
    time:"18:05", day:"sunday",
    text:"you're on. prepare your wallet"
  },
  {
    id:"arjun-m8", from:"Arjun Mehta",
    time:"18:06", day:"sunday",
    text:"last time you rage quit in the 70th minute"
  },
  {
    id:"arjun-m9", from:"me", sent:true, read:true,
    time:"18:08", day:"sunday",
    text:"the controller disconnected. ALLEGEDLY"
  },
  {
    id:"arjun-m10", from:"Arjun Mehta",
    time:"13:00", day:"monday", type:"voice", duration:30,
    text:"🎤 voice message (0:30)"
  },
  {
    id:"arjun-m11", from:"me", sent:true, read:true,
    time:"13:20", day:"monday",
    text:"that catch!! how even"
  },
  {
    id:"arjun-m12", from:"Arjun Mehta",
    time:"13:22", day:"monday",
    text:"jaddu is not human"
  },
  {
    id:"arjun-m13", from:"Arjun Mehta",
    time:"20:00", day:"tuesday",
    text:"gym tomorrow 6am? leg day"
  },
  {
    id:"arjun-m14", from:"me", sent:true, read:true,
    time:"20:05", day:"tuesday",
    text:"6am is a myth. 7?"
  },
  {
    id:"arjun-m15", from:"Arjun Mehta",
    time:"20:06", day:"tuesday",
    text:"fine. don't bail"
  },
  {
    id:"arjun-m16", from:"me", sent:true, read:true,
    time:"20:07", day:"tuesday",
    text:"i never bail"
  },
  {
    id:"arjun-m17", from:"Arjun Mehta",
    time:"20:08", day:"tuesday",
    text:"you bailed last tuesday"
  },
  {
    id:"arjun-m18", from:"me", sent:true, read:true,
    time:"20:09", day:"tuesday",
    text:"...7am. confirmed."
  },
  {
    id:"arjun-m19", from:"Arjun Mehta", starred:true,
    time:"22:10", day:"yesterday",
    text:"fantasy league standings are out. i'm 2nd 😎"
  },
  {
    id:"arjun-m20", from:"me", sent:true, read:true,
    time:"22:15", day:"yesterday",
    text:"i'm 47th. my team is cursed"
  },
  {
    id:"arjun-m21", from:"Arjun Mehta",
    time:"22:16", day:"yesterday",
    text:"you picked 3 wicketkeepers bro"
  },
  {
    id:"arjun-m22", from:"me", sent:true, read:true,
    time:"22:17", day:"yesterday",
    text:"strategy 😤"
  },
  {
    id:"arjun-m23", from:"Arjun Mehta",
    time:"12:40", day:"today",
    text:"bro the match last night was insane"
  },
  {
    id:"arjun-m24", from:"me", sent:true, read:true,
    time:"12:45", day:"today",
    text:"that last over!! kohli went beast mode 🔥"
  },
  {
    id:"arjun-m25", from:"Arjun Mehta",
    time:"12:47", day:"today",
    text:"we're watching the final at my place, bring snacks"
  }
  ];

  /* ----- Project Nova 🚀 (group) ----- */
  byId.nova.messages = [
  {
    id:"nova-m0", from:"Rahul",
    time:"16:00", day:"friday",
    text:"retro notes are up, add your points before eod"
  },
  {
    id:"nova-m1", from:"me", sent:true, read:true,
    time:"16:20", day:"friday",
    text:"done. main point: fewer meetings 😅"
  },
  {
    id:"nova-m2", from:"Neha",
    time:"16:25", day:"friday",
    text:"+100"
  },
  {
    id:"nova-m3", from:"Neha",
    time:"10:00", day:"saturday",
    text:"weekend deploy went smooth, no pages 🎉"
  },
  {
    id:"nova-m4", from:"me", sent:true, read:true,
    time:"10:05", day:"saturday",
    text:"the on-call gods smiled upon us"
  },
  {
    id:"nova-m5", from:"Vikram",
    time:"10:06", day:"saturday",
    text:"don't jinx it"
  },
  {
    id:"nova-m6", from:"Rahul",
    time:"19:30", day:"sunday",
    text:"quick sync at 8pm? prod issue"
  },
  {
    id:"nova-m7", from:"Vikram",
    time:"19:35", day:"sunday",
    text:"on it, checking logs"
  },
  {
    id:"nova-m8", from:"Neha",
    time:"19:45", day:"sunday",
    text:"looks like the redis cache expired early"
  },
  {
    id:"nova-m9", from:"Vikram",
    time:"20:00", day:"sunday",
    text:"fixed. ttl was set to 60s instead of 600. my bad 🙏"
  },
  {
    id:"nova-m10", from:"Rahul",
    time:"20:05", day:"sunday",
    text:"all good. monitoring it"
  },
  {
    id:"nova-m11", from:"me", sent:true, read:true,
    time:"09:15", day:"monday", type:"doc",
    filename:"nova-api-spec-v2.pdf", size:"2.4 MB",
    text:"📄 nova-api-spec-v2.pdf"
  },
  {
    id:"nova-m12", from:"Rahul",
    time:"10:00", day:"monday",
    text:"spec looks solid. two endpoints need rate limits"
  },
  {
    id:"nova-m13", from:"Neha",
    time:"10:05", day:"monday",
    text:"adding that to the ticket"
  },
  {
    id:"nova-m14", from:"me", sent:true, read:true,
    time:"10:10", day:"monday",
    text:"i'll update the spec tonight"
  },
  {
    id:"nova-m15", from:"Vikram",
    time:"10:00", day:"tuesday",
    text:"auth PR is up, needs 2 reviewers"
  },
  {
    id:"nova-m16", from:"me", sent:true, read:true,
    time:"10:30", day:"tuesday",
    text:"reviewing now"
  },
  {
    id:"nova-m17", from:"me", sent:true, read:true,
    time:"11:00", day:"tuesday",
    quote:{from:"Vikram", text:"auth PR is up, needs 2 reviewers"},
    text:"left 3 comments, mostly nits"
  },
  {
    id:"nova-m18", from:"Vikram",
    time:"11:30", day:"tuesday",
    text:"addressed. merging after ci"
  },
  {
    id:"nova-m19", from:"Rahul", starred:true,
    time:"14:00", day:"tuesday",
    text:"client loved the prototype btw 🎉"
  },
  {
    id:"nova-m20", from:"Neha",
    time:"14:05", day:"tuesday",
    text:"lessgooo"
  },
  {
    id:"nova-m21", from:"Rahul",
    time:"17:00", day:"yesterday",
    text:"sprint planning at 11 tomorrow, have your tickets ready"
  },
  {
    id:"nova-m22", from:"Neha",
    time:"17:05", day:"yesterday",
    text:"can we PLEASE fix the flaky login test first"
  },
  {
    id:"nova-m23", from:"Vikram",
    time:"17:10", day:"yesterday",
    text:"it's flaky because it depends on system time. i'll mock it"
  },
  {
    id:"nova-m24", from:"me", sent:true, read:true,
    time:"17:12", day:"yesterday",
    text:"hero 🦸"
  },
  {
    id:"nova-m25", from:"Rahul",
    time:"18:30", day:"yesterday",
    text:"demo deck draft is in the drive, add your slides"
  },
  {
    id:"nova-m26", from:"Neha",
    time:"19:00", day:"yesterday",
    text:"added the metrics slide 📊"
  },
  {
    id:"nova-m27", from:"Rahul",
    time:"09:50", day:"today",
    text:"standup in 10, don't be late 👀"
  },
  {
    id:"nova-m28", from:"Neha",
    time:"10:05", day:"today",
    text:"the staging deploy is green ✅"
  },
  {
    id:"nova-m29", from:"Vikram",
    time:"10:20", day:"today",
    text:"nice, I'll merge the auth PR after lunch"
  },
  {
    id:"nova-m30", from:"me", sent:true, read:true,
    time:"10:25", day:"today",
    text:"I'll pick up the dashboard tickets"
  },
  {
    id:"nova-m31", from:"Rahul",
    time:"11:30", day:"today",
    text:"client demo moved to Thursday btw"
  }
  ];

  /* ----- Mom (dm) ----- */
  byId.mom.messages = [
  {
    id:"mom-m0", from:"Mom",
    time:"08:00", day:"friday",
    text:"don't forget to drink water"
  },
  {
    id:"mom-m1", from:"me", sent:true, read:true,
    time:"08:05", day:"friday",
    text:"yes amma"
  },
  {
    id:"mom-m2", from:"Mom",
    time:"08:06", day:"friday",
    text:"and eat fruits"
  },
  {
    id:"mom-m3", from:"me", sent:true, read:true,
    time:"08:07", day:"friday",
    text:"yes amma 🍎"
  },
  {
    id:"mom-m4", from:"Mom",
    time:"11:00", day:"saturday",
    text:"your father bought mangoes, come take some"
  },
  {
    id:"mom-m5", from:"me", sent:true, read:true,
    time:"11:05", day:"saturday",
    text:"alphonso??"
  },
  {
    id:"mom-m6", from:"Mom",
    time:"11:06", day:"saturday",
    text:"yes. come before sneha finishes them"
  },
  {
    id:"mom-m7", from:"me", sent:true, read:true,
    time:"11:07", day:"saturday",
    text:"on my way 🏃"
  },
  {
    id:"mom-m8", from:"Mom",
    time:"21:00", day:"sunday",
    text:"did you reach home? it was raining"
  },
  {
    id:"mom-m9", from:"me", sent:true, read:true,
    time:"21:05", day:"sunday",
    text:"yes amma, safe"
  },
  {
    id:"mom-m10", from:"Mom",
    time:"21:06", day:"sunday",
    text:"good night beta ❤️"
  },
  {
    id:"mom-m11", from:"Mom",
    time:"13:00", day:"monday", type:"image", starred:true,
    seed:"mom-payasam", caption:"made payasam, kept a box for you 🍮",
    text:"📷 made payasam, kept a box for you 🍮"
  },
  {
    id:"mom-m12", from:"me", sent:true, read:true,
    time:"13:10", day:"monday",
    text:"coming sunday for sure now 😍"
  },
  {
    id:"mom-m13", from:"Mom",
    time:"13:12", day:"monday",
    text:"bring your laundry also"
  },
  {
    id:"mom-m14", from:"me", sent:true, read:true,
    time:"13:13", day:"monday",
    text:"of course 😅"
  },
  {
    id:"mom-m15", from:"Mom",
    time:"19:00", day:"tuesday", type:"voice", duration:55,
    text:"🎤 voice message (0:55)"
  },
  {
    id:"mom-m16", from:"me", sent:true, read:true,
    time:"19:05", day:"tuesday",
    text:"amma i can't hear, too much traffic. i'll call at 9"
  },
  {
    id:"mom-m17", from:"Mom",
    time:"19:06", day:"tuesday",
    text:"ok"
  },
  {
    id:"mom-m18", from:"Mom",
    time:"19:07", day:"tuesday",
    text:"take an auto, don't walk in this rain"
  },
  {
    id:"mom-m19", from:"Mom",
    time:"09:00", day:"yesterday",
    text:"call your grandmother, she was asking about you"
  },
  {
    id:"mom-m20", from:"me", sent:true, read:true,
    time:"09:30", day:"yesterday",
    text:"will call tonight 👍"
  },
  {
    id:"mom-m21", from:"Mom",
    time:"20:10", day:"yesterday",
    text:"did you eat?"
  },
  {
    id:"mom-m22", from:"me", sent:true, read:true,
    time:"20:15", day:"yesterday",
    text:"yes amma, had dinner"
  },
  {
    id:"mom-m23", from:"Mom",
    time:"20:16", day:"yesterday",
    text:"good. don't skip breakfast tomorrow"
  },
  {
    id:"mom-m24", from:"me", sent:true, read:true,
    time:"20:18", day:"yesterday",
    text:"😅 ok"
  }
  ];

  /* ----- College Gang (group) ----- */
  byId.college.messages = [
  {
    id:"college-m0", from:"Divya",
    time:"10:00", day:"saturday",
    text:"reunion dinner this friday? 8pm, indiranagar"
  },
  {
    id:"college-m1", from:"me", sent:true, read:true,
    time:"10:05", day:"saturday",
    text:"in ✅"
  },
  {
    id:"college-m2", from:"Farhan",
    time:"10:06", day:"saturday",
    text:"in"
  },
  {
    id:"college-m3", from:"Zoya",
    time:"10:10", day:"saturday",
    text:"might be late, will join by 9"
  },
  {
    id:"college-m4", from:"Kiran",
    time:"10:15", day:"saturday",
    text:"in. booking a table for 5"
  },
  {
    id:"college-m5", from:"Kiran",
    time:"19:00", day:"sunday",
    text:"anyone watching the match tonight?"
  },
  {
    id:"college-m6", from:"Farhan",
    time:"19:05", day:"sunday",
    text:"at divya's place, come over"
  },
  {
    id:"college-m7", from:"me", sent:true, read:true,
    time:"19:10", day:"sunday",
    text:"bringing chips"
  },
  {
    id:"college-m8", from:"Divya",
    time:"19:15", day:"sunday",
    text:"i have the projector ready 📽️"
  },
  {
    id:"college-m9", from:"Zoya", starred:true,
    time:"18:00", day:"monday",
    text:"guys my appraisal came through 🎉"
  },
  {
    id:"college-m10", from:"Divya",
    time:"18:05", day:"monday",
    text:"CONGRATS!! party when"
  },
  {
    id:"college-m11", from:"Farhan",
    time:"18:06", day:"monday",
    text:"goa trip = celebration trip now"
  },
  {
    id:"college-m12", from:"Kiran",
    time:"18:10", day:"monday",
    text:"double celebration"
  },
  {
    id:"college-m13", from:"me", sent:true, read:true,
    time:"18:12", day:"monday",
    text:"proud of you zoya! 🥳"
  },
  {
    id:"college-m14", from:"Farhan",
    time:"12:00", day:"tuesday",
    text:"found a villa in morjim, 12k/night for all of us"
  },
  {
    id:"college-m15", from:"Divya",
    time:"12:05", day:"tuesday",
    text:"that's actually cheap??"
  },
  {
    id:"college-m16", from:"Zoya",
    time:"12:10", day:"tuesday",
    text:"split 5 ways = 2.4k each. doable"
  },
  {
    id:"college-m17", from:"Kiran",
    time:"12:15", day:"tuesday",
    text:"sending the link in a bit, has a pool"
  },
  {
    id:"college-m18", from:"me", sent:true, read:true,
    time:"12:20", day:"tuesday",
    text:"pool = sold"
  },
  {
    id:"college-m19", from:"Divya",
    time:"20:00", day:"yesterday",
    text:"throwback to our last trip 😭"
  },
  {
    id:"college-m20", from:"Farhan",
    time:"20:05", day:"yesterday", type:"image",
    seed:"college-goa-2019", caption:"goa 2019. we were babies",
    text:"📷 goa 2019. we were babies"
  },
  {
    id:"college-m21", from:"Zoya",
    time:"20:06", day:"yesterday",
    text:"kiran's sunburn 💀"
  },
  {
    id:"college-m22", from:"Kiran",
    time:"20:08", day:"yesterday",
    text:"i've been bullied for 5 years about this"
  },
  {
    id:"college-m23", from:"me", sent:true, read:true,
    time:"20:10", day:"yesterday",
    text:"and we'll bully for 5 more"
  },
  {
    id:"college-m24", from:"Farhan",
    time:"14:00", day:"today",
    text:"goa trip planning starts NOW 🏖️"
  },
  {
    id:"college-m25", from:"Divya",
    time:"14:05", day:"today",
    text:"finally!! december first week?"
  },
  {
    id:"college-m26", from:"Zoya",
    time:"14:10", day:"today",
    text:"I can only do 5th to 9th"
  },
  {
    id:"college-m27", from:"Kiran",
    time:"14:12", day:"today",
    text:"flights are cheap right now, we should book soon"
  },
  {
    id:"college-m28", from:"me", sent:true, read:true,
    time:"14:15", day:"today",
    text:"I'm in, let's make a sheet"
  },
  {
    id:"college-m29", from:"Farhan",
    time:"14:16", day:"today",
    text:"rehan making sheets = it's serious 😂"
  }
  ];

  /* ----- Ravi Kumar (dm) ----- */
  byId.ravi.messages = [
  {
    id:"ravi-m0", from:"Ravi Kumar",
    time:"22:00", day:"thursday",
    text:"bro the new spiderman trailer"
  },
  {
    id:"ravi-m1", from:"me", sent:true, read:true,
    time:"22:05", day:"thursday",
    text:"day one. imax."
  },
  {
    id:"ravi-m2", from:"Ravi Kumar",
    time:"22:06", day:"thursday",
    text:"obviously"
  },
  {
    id:"ravi-m3", from:"Ravi Kumar",
    time:"14:00", day:"friday",
    text:"how's the new project going?"
  },
  {
    id:"ravi-m4", from:"me", sent:true, read:true,
    time:"14:10", day:"friday",
    text:"hectic but fun. demo next week"
  },
  {
    id:"ravi-m5", from:"Ravi Kumar",
    time:"14:12", day:"friday",
    text:"you'll kill it 💪"
  },
  {
    id:"ravi-m6", from:"Ravi Kumar",
    time:"10:00", day:"saturday",
    text:"cricket sunday morning? 6am turf"
  },
  {
    id:"ravi-m7", from:"me", sent:true, read:true,
    time:"10:05", day:"saturday",
    text:"i'll try. no promises"
  },
  {
    id:"ravi-m8", from:"Ravi Kumar",
    time:"10:06", day:"saturday",
    text:"you always say that and always come"
  },
  {
    id:"ravi-m9", from:"me", sent:true, read:true,
    time:"10:08", day:"saturday",
    text:"because you guilt trip me"
  },
  {
    id:"ravi-m10", from:"Ravi Kumar",
    time:"18:00", day:"sunday", type:"image",
    seed:"ravi-diwali-lights", caption:"test run of the lights 🪔",
    text:"📷 test run of the lights 🪔"
  },
  {
    id:"ravi-m11", from:"me", sent:true, read:true,
    time:"18:10", day:"sunday",
    text:"looking good! our street is going to glow"
  },
  {
    id:"ravi-m12", from:"Ravi Kumar",
    time:"18:12", day:"sunday",
    text:"bought 200 diyas this year"
  },
  {
    id:"ravi-m13", from:"Ravi Kumar", starred:true,
    time:"21:00", day:"monday",
    text:"remember our diwali 2015? we nearly set the terrace on fire"
  },
  {
    id:"ravi-m14", from:"me", sent:true, read:true,
    time:"21:05", day:"monday",
    text:"WE did? YOU did 😂"
  },
  {
    id:"ravi-m15", from:"Ravi Kumar",
    time:"21:06", day:"monday",
    text:"details details"
  },
  {
    id:"ravi-m16", from:"me", sent:true, read:true,
    time:"21:08", day:"monday",
    text:"amma still brings it up every diwali"
  },
  {
    id:"ravi-m17", from:"Ravi Kumar",
    time:"20:00", day:"tuesday",
    text:"diwali is next month, are you coming home?"
  },
  {
    id:"ravi-m18", from:"me", sent:true, read:true,
    time:"20:05", day:"tuesday",
    text:"28th. train tickets booked 🚂"
  },
  {
    id:"ravi-m19", from:"Ravi Kumar",
    time:"20:06", day:"tuesday",
    text:"nice! mama's making murukku"
  },
  {
    id:"ravi-m20", from:"me", sent:true, read:true,
    time:"20:08", day:"tuesday",
    text:"tell her to double the batch"
  },
  {
    id:"ravi-m21", from:"Ravi Kumar",
    time:"19:00", day:"yesterday",
    text:"mama asked about your job, told him you're building apps"
  },
  {
    id:"ravi-m22", from:"me", sent:true, read:true,
    time:"19:05", day:"yesterday",
    text:"haha thanks for the PR"
  },
  {
    id:"ravi-m23", from:"Ravi Kumar",
    time:"19:06", day:"yesterday",
    text:"anytime bro. diwali plans?"
  }
  ];

  /* ----- Sneha Rao (dm) ----- */
  byId.sneha.messages = [
  {
    id:"sneha-m0", from:"Sneha Rao",
    time:"23:00", day:"friday",
    text:"thank you for always picking up my calls 🥺"
  },
  {
    id:"sneha-m1", from:"me", sent:true, read:true,
    time:"23:05", day:"friday",
    text:"that's what brothers are for"
  },
  {
    id:"sneha-m2", from:"Sneha Rao",
    time:"17:00", day:"saturday",
    text:"amma suspects something. she's asking too many questions"
  },
  {
    id:"sneha-m3", from:"me", sent:true, read:true,
    time:"17:05", day:"saturday",
    text:"amma always suspects something. it's her superpower"
  },
  {
    id:"sneha-m4", from:"Sneha Rao",
    time:"17:06", day:"saturday",
    text:"😂 true"
  },
  {
    id:"sneha-m5", from:"Sneha Rao",
    time:"06:30", day:"sunday", type:"image",
    seed:"sneha-marine-drive", caption:"marine drive hits different at 6am 🌅",
    text:"📷 marine drive hits different at 6am 🌅"
  },
  {
    id:"sneha-m6", from:"me", sent:true, read:true,
    time:"09:00", day:"sunday",
    text:"wait you're IN mumbai already?"
  },
  {
    id:"sneha-m7", from:"Sneha Rao",
    time:"09:05", day:"sunday",
    text:"just for the weekend! cousin's place"
  },
  {
    id:"sneha-m8", from:"me", sent:true, read:true,
    time:"09:06", day:"sunday",
    text:"traitor 😤"
  },
  {
    id:"sneha-m9", from:"Sneha Rao",
    time:"22:00", day:"monday",
    text:"watched 3 episodes of that show you recommended"
  },
  {
    id:"sneha-m10", from:"me", sent:true, read:true,
    time:"22:05", day:"monday",
    text:"and??"
  },
  {
    id:"sneha-m11", from:"Sneha Rao",
    time:"22:06", day:"monday",
    text:"okay fine it's amazing. you were right"
  },
  {
    id:"sneha-m12", from:"me", sent:true, read:true,
    time:"22:08", day:"monday",
    text:"screenshotting this for posterity"
  },
  {
    id:"sneha-m13", from:"Sneha Rao",
    time:"18:00", day:"tuesday",
    text:"mumbai vs bangalore? help me decide"
  },
  {
    id:"sneha-m14", from:"me", sent:true, read:true,
    time:"18:05", day:"tuesday",
    text:"mumbai = money + local trains. blr = weather + us"
  },
  {
    id:"sneha-m15", from:"Sneha Rao",
    time:"18:06", day:"tuesday",
    text:"don't guilt trip me with 'us' 🥺"
  },
  {
    id:"sneha-m16", from:"me", sent:true, read:true,
    time:"18:08", day:"tuesday",
    text:"it's a valid data point"
  },
  {
    id:"sneha-m17", from:"Sneha Rao",
    time:"21:00", day:"yesterday",
    text:"interview is on friday. i'm freaking out"
  },
  {
    id:"sneha-m18", from:"me", sent:true, read:true,
    time:"21:05", day:"yesterday",
    text:"you've got this. they already like your profile"
  },
  {
    id:"sneha-m19", from:"Sneha Rao",
    time:"21:06", day:"yesterday",
    text:"what if they ask about the gap year"
  },
  {
    id:"sneha-m20", from:"me", sent:true, read:true,
    time:"21:10", day:"yesterday",
    text:"you freelanced and upskilled. that's a story, not a gap"
  },
  {
    id:"sneha-m21", from:"Sneha Rao",
    time:"21:12", day:"yesterday",
    text:"okay. deep breaths 🧘"
  },
  {
    id:"sneha-m22", from:"Sneha Rao",
    time:"16:30", day:"today",
    text:"can you review my resume tonight?"
  },
  {
    id:"sneha-m23", from:"me", sent:true, read:true,
    time:"16:35", day:"today",
    text:"send it over"
  },
  {
    id:"sneha-m24", from:"Sneha Rao",
    time:"16:38", day:"today", type:"doc",
    filename:"Sneha_Rao_Resume_v3.pdf", size:"312 KB",
    text:"📄 Sneha_Rao_Resume_v3.pdf"
  },
  {
    id:"sneha-m25", from:"Sneha Rao", starred:true,
    time:"16:40", day:"today",
    text:"sent! also don't tell amma about the mumbai interview 🤫"
  }
  ];

  /* ----- Design Team 🎨 (group) ----- */
  byId.design.messages = [
  {
    id:"design-m0", from:"Meera",
    time:"11:00", day:"saturday",
    text:"weekend inspo: that new fintech app's onboarding"
  },
  {
    id:"design-m1", from:"Kabir",
    time:"11:05", day:"saturday",
    text:"the illustrations are gorgeous"
  },
  {
    id:"design-m2", from:"Tara",
    time:"11:10", day:"saturday",
    text:"stealing... i mean, getting inspired by the empty states"
  },
  {
    id:"design-m3", from:"me", sent:true, read:true,
    time:"11:12", day:"saturday",
    text:"inspiration, not imitation 😌"
  },
  {
    id:"design-m4", from:"Kabir",
    time:"12:00", day:"sunday",
    text:"anyone up for a design systems deep-dive this week?"
  },
  {
    id:"design-m5", from:"Tara",
    time:"12:05", day:"sunday",
    text:"me! tuesday 4pm?"
  },
  {
    id:"design-m6", from:"Meera",
    time:"12:10", day:"sunday",
    text:"in. i'll bring the tokens talk"
  },
  {
    id:"design-m7", from:"Meera", starred:true,
    time:"15:00", day:"monday", type:"image",
    seed:"design-mockup-v2", caption:"homepage v2 — thoughts?",
    text:"📷 homepage v2 — thoughts?"
  },
  {
    id:"design-m8", from:"Kabir",
    time:"15:10", day:"monday",
    quote:{from:"Meera", text:"homepage v2 — thoughts?"},
    text:"the hero spacing is perfect. ship it"
  },
  {
    id:"design-m9", from:"Tara",
    time:"15:15", day:"monday",
    text:"agreed. the type scale finally feels right"
  },
  {
    id:"design-m10", from:"me", sent:true, read:true,
    time:"15:20", day:"monday",
    text:"pushing to staging for client review"
  },
  {
    id:"design-m11", from:"Tara",
    time:"11:00", day:"tuesday", type:"doc",
    filename:"client-brief-q4.pdf", size:"1.8 MB",
    text:"📄 client-brief-q4.pdf"
  },
  {
    id:"design-m12", from:"Meera",
    time:"11:30", day:"tuesday",
    text:"brief says 'premium but approachable'. so... everything"
  },
  {
    id:"design-m13", from:"Kabir",
    time:"11:35", day:"tuesday",
    text:"my favorite kind of brief 🙃"
  },
  {
    id:"design-m14", from:"me", sent:true, read:true,
    time:"11:40", day:"tuesday",
    text:"moodboard by eod?"
  },
  {
    id:"design-m15", from:"Tara",
    time:"11:42", day:"tuesday",
    text:"on it"
  },
  {
    id:"design-m16", from:"Kabir",
    time:"16:00", day:"yesterday",
    text:"deadline moved up to friday 😭"
  },
  {
    id:"design-m17", from:"Tara",
    time:"16:05", day:"yesterday",
    text:"of course it did"
  },
  {
    id:"design-m18", from:"me", sent:true, read:true,
    time:"16:10", day:"yesterday",
    text:"ok war room tomorrow 10am. we got this"
  },
  {
    id:"design-m19", from:"Meera",
    time:"16:15", day:"yesterday",
    text:"i'll finish the mobile screens tonight"
  },
  {
    id:"design-m20", from:"Kabir",
    time:"16:20", day:"yesterday",
    text:"i'll handle the design system tokens"
  },
  {
    id:"design-m21", from:"Meera",
    time:"10:00", day:"today",
    text:"figma file updated, check the new checkout flow"
  },
  {
    id:"design-m22", from:"Kabir",
    time:"10:15", day:"today",
    text:"the micro-interactions are *chef's kiss*"
  },
  {
    id:"design-m23", from:"me", sent:true, read:true,
    time:"10:30", day:"today",
    text:"client feedback is in. they love the direction 🎉"
  },
  {
    id:"design-m24", from:"Tara",
    time:"10:35", day:"today",
    text:"finally! after 4 rounds of 'make it pop'"
  },
  {
    id:"design-m25", from:"Meera",
    time:"10:36", day:"today",
    text:"never saying 'pop' again"
  }
  ];

  /* ----- Gym Buddies 💪 (group) ----- */
  byId.gym.messages = [
  {
    id:"gym-m0", from:"Dev",
    time:"17:00", day:"friday",
    text:"turf football sunday? need 2 more players"
  },
  {
    id:"gym-m1", from:"Nikhil",
    time:"17:05", day:"friday",
    text:"i'm in"
  },
  {
    id:"gym-m2", from:"me", sent:true, read:true,
    time:"17:10", day:"friday",
    text:"in. bringing arjun too"
  },
  {
    id:"gym-m3", from:"me", sent:true, read:true,
    time:"10:00", day:"saturday",
    text:"rest day. my body thanks me"
  },
  {
    id:"gym-m4", from:"Dev",
    time:"10:05", day:"saturday",
    text:"rest is part of the program 😌"
  },
  {
    id:"gym-m5", from:"Nikhil",
    time:"10:06", day:"saturday",
    text:"he says, eating biryani"
  },
  {
    id:"gym-m6", from:"me", sent:true, read:true,
    time:"10:08", day:"saturday",
    text:"protein biryani. it's different"
  },
  {
    id:"gym-m7", from:"Nikhil",
    time:"13:00", day:"sunday", type:"image",
    seed:"gym-meal-prep", caption:"meal prep sunday 🍗🥦",
    text:"📷 meal prep sunday 🍗🥦"
  },
  {
    id:"gym-m8", from:"me", sent:true, read:true,
    time:"13:10", day:"sunday",
    text:"that's 5 days of chicken. respect"
  },
  {
    id:"gym-m9", from:"Dev",
    time:"13:12", day:"sunday",
    text:"where's the taste"
  },
  {
    id:"gym-m10", from:"Nikhil",
    time:"13:15", day:"sunday",
    text:"taste is for cheat days"
  },
  {
    id:"gym-m11", from:"Dev", starred:true,
    time:"08:00", day:"monday",
    text:"new PR! 100kg deadlift 🏋️"
  },
  {
    id:"gym-m12", from:"Nikhil",
    time:"08:05", day:"monday",
    text:"BEAST"
  },
  {
    id:"gym-m13", from:"me", sent:true, read:true,
    time:"08:10", day:"monday",
    text:"teach me your ways"
  },
  {
    id:"gym-m14", from:"Dev",
    time:"08:12", day:"monday",
    text:"eat. sleep. lift. repeat."
  },
  {
    id:"gym-m15", from:"Dev",
    time:"18:30", day:"yesterday", type:"voice", duration:48,
    text:"🎤 voice message (0:48)"
  },
  {
    id:"gym-m16", from:"Nikhil",
    time:"19:00", day:"yesterday",
    text:"protein powder is on sale, 2kg for 3.2k"
  },
  {
    id:"gym-m17", from:"me", sent:true, read:true,
    time:"19:05", day:"yesterday",
    text:"link please 🙏"
  },
  {
    id:"gym-m18", from:"Dev",
    time:"19:10", day:"yesterday",
    text:"ordered. no more excuses"
  },
  {
    id:"gym-m19", from:"Dev",
    time:"07:30", day:"today",
    text:"leg day done. i can't feel my legs 🦵💀"
  },
  {
    id:"gym-m20", from:"Nikhil",
    time:"07:45", day:"today",
    text:"that's how you know it worked"
  },
  {
    id:"gym-m21", from:"me", sent:true, read:true,
    time:"12:00", day:"today",
    text:"going at 6pm, who's in?"
  },
  {
    id:"gym-m22", from:"Dev",
    time:"12:05", day:"today",
    text:"i'm in. chest day"
  },
  {
    id:"gym-m23", from:"Nikhil",
    time:"12:10", day:"today",
    text:"can't, deadline. tomorrow 6am?"
  },
  {
    id:"gym-m24", from:"me", sent:true, read:true,
    time:"12:12", day:"today",
    text:"6am it is ⏰"
  }
  ];

  /* ----- Aisha Khan (dm) ----- */
  byId.aisha.messages = [
  {
    id:"aisha-m0", from:"Aisha Khan",
    time:"21:00", day:"friday",
    text:"long week. coffee tomorrow morning?"
  },
  {
    id:"aisha-m1", from:"me", sent:true, read:true,
    time:"21:05", day:"friday",
    text:"third wave, 10am?"
  },
  {
    id:"aisha-m2", from:"Aisha Khan",
    time:"21:10", day:"friday",
    text:"see you there ☕"
  },
  {
    id:"aisha-m3", from:"me", sent:true, read:true,
    time:"09:00", day:"saturday",
    text:"happy birthday!! 🎂"
  },
  {
    id:"aisha-m4", from:"Aisha Khan",
    time:"09:30", day:"saturday",
    text:"thank you!! dinner's on me tonight, 8pm?"
  },
  {
    id:"aisha-m5", from:"me", sent:true, read:true,
    time:"09:35", day:"saturday",
    text:"wouldn't miss it"
  },
  {
    id:"aisha-m6", from:"Aisha Khan",
    time:"17:00", day:"sunday",
    text:"that sunset point you mentioned — where exactly?"
  },
  {
    id:"aisha-m7", from:"me", sent:true, read:true,
    time:"17:10", day:"sunday",
    text:"nandi hills, the second viewpoint. go by 5:30"
  },
  {
    id:"aisha-m8", from:"Aisha Khan",
    time:"17:12", day:"sunday",
    text:"noted. dragging you next time"
  },
  {
    id:"aisha-m9", from:"Aisha Khan",
    time:"13:00", day:"monday",
    text:"recommend a book? need something light"
  },
  {
    id:"aisha-m10", from:"me", sent:true, read:true,
    time:"13:10", day:"monday",
    text:"'the midnight library'. you'll finish it in 2 days"
  },
  {
    id:"aisha-m11", from:"Aisha Khan",
    time:"13:15", day:"monday",
    text:"ordered ✅"
  },
  {
    id:"aisha-m12", from:"Aisha Khan",
    time:"20:00", day:"tuesday",
    text:"weekend plans? there's a flea market at kitsch mandi"
  },
  {
    id:"aisha-m13", from:"me", sent:true, read:true,
    time:"20:05", day:"tuesday",
    text:"i'm in if there's good food"
  },
  {
    id:"aisha-m14", from:"Aisha Khan",
    time:"20:06", day:"tuesday",
    text:"there's always good food. that's the point"
  },
  {
    id:"aisha-m15", from:"me", sent:true, read:true,
    time:"20:08", day:"tuesday",
    text:"fair 😌"
  },
  {
    id:"aisha-m16", from:"Aisha Khan", starred:true,
    time:"18:00", day:"yesterday", type:"image",
    seed:"aisha-street-photo", caption:"today's street series 📸",
    text:"📷 today's street series 📸"
  },
  {
    id:"aisha-m17", from:"me", sent:true, read:true,
    time:"18:15", day:"yesterday",
    text:"the third one is wallpaper material"
  },
  {
    id:"aisha-m18", from:"Aisha Khan",
    time:"18:20", day:"yesterday",
    text:"that's the one i'm printing!"
  },
  {
    id:"aisha-m19", from:"Aisha Khan",
    time:"11:00", day:"today",
    text:"tried that new café in indiranagar. the tiramisu latte!!"
  },
  {
    id:"aisha-m20", from:"me", sent:true, read:true,
    time:"11:05", day:"today",
    text:"you had me at tiramisu"
  },
  {
    id:"aisha-m21", from:"Aisha Khan",
    time:"11:06", day:"today",
    text:"going again saturday, join?"
  },
  {
    id:"aisha-m22", from:"me", sent:true, read:true,
    time:"11:10", day:"today",
    text:"4pm? i'll bring my camera too 📷"
  },
  {
    id:"aisha-m23", from:"Aisha Khan",
    time:"11:12", day:"today",
    text:"perfect, golden hour shots"
  }
  ];

  /* ----- Mr. Iyer (Landlord) (dm) ----- */
  byId.landlord.messages = [
  {
    id:"landlord-m0", from:"Mr. Iyer",
    time:"19:00", day:"friday",
    text:"Water supply will be shut from 10am to 2pm on Saturday for tank cleaning."
  },
  {
    id:"landlord-m1", from:"me", sent:true, read:true,
    time:"19:10", day:"friday",
    text:"Noted sir, thank you for informing."
  },
  {
    id:"landlord-m2", from:"Mr. Iyer",
    time:"19:12", day:"friday",
    text:"Welcome."
  },
  {
    id:"landlord-m3", from:"me", sent:true, read:true,
    time:"10:00", day:"saturday",
    text:"Sir, the society maintenance bill — should I pay directly or to you?"
  },
  {
    id:"landlord-m4", from:"Mr. Iyer",
    time:"10:30", day:"saturday",
    text:"Pay directly to the society office. Keep the receipt."
  },
  {
    id:"landlord-m5", from:"me", sent:true, read:true,
    time:"11:00", day:"saturday",
    text:"Done sir ✅"
  },
  {
    id:"landlord-m6", from:"Mr. Iyer",
    time:"12:00", day:"sunday",
    text:"Please keep the corridor clean. Some boxes were left outside your door."
  },
  {
    id:"landlord-m7", from:"me", sent:true, read:true,
    time:"12:15", day:"sunday",
    text:"Sorry sir, those were delivery boxes. Cleared them already."
  },
  {
    id:"landlord-m8", from:"Mr. Iyer",
    time:"12:20", day:"sunday",
    text:"Good."
  },
  {
    id:"landlord-m9", from:"Mr. Iyer",
    time:"10:00", day:"monday", type:"doc",
    filename:"rent-agreement-2026.pdf", size:"856 KB",
    text:"📄 rent-agreement-2026.pdf"
  },
  {
    id:"landlord-m10", from:"Mr. Iyer",
    time:"10:05", day:"monday",
    text:"Please find the renewed agreement. Sign and return one copy."
  },
  {
    id:"landlord-m11", from:"me", sent:true, read:true,
    time:"10:20", day:"monday",
    text:"Received sir, will sign and return by Friday."
  },
  {
    id:"landlord-m12", from:"me", sent:true, read:true,
    time:"11:00", day:"tuesday",
    text:"Sir, the bathroom tap is leaking slightly. Could you please send someone?"
  },
  {
    id:"landlord-m13", from:"Mr. Iyer",
    time:"13:00", day:"tuesday",
    text:"I will ask Mani to look at it on Thursday."
  },
  {
    id:"landlord-m14", from:"me", sent:true, read:true,
    time:"13:05", day:"tuesday",
    text:"Thank you sir 🙏"
  },
  {
    id:"landlord-m15", from:"Mr. Iyer",
    time:"18:00", day:"yesterday",
    text:"The plumber will come tomorrow between 10 and 12 for the kitchen sink."
  },
  {
    id:"landlord-m16", from:"me", sent:true, read:true,
    time:"18:10", day:"yesterday",
    text:"Noted sir, I'll be home."
  },
  {
    id:"landlord-m17", from:"Mr. Iyer",
    time:"09:00", day:"today",
    text:"Good morning. This is a reminder that rent for October is due by the 5th."
  },
  {
    id:"landlord-m18", from:"me", sent:true, read:true,
    time:"09:15", day:"today",
    text:"Good morning sir, will transfer by 3rd 👍"
  }
  ];

  /* ----- Book Club 📚 (group) ----- */
  byId.bookclub.messages = [
  {
    id:"bookclub-m0", from:"Divya",
    time:"18:00", day:"saturday",
    text:"library sale at blossoms tomorrow, 50% off"
  },
  {
    id:"bookclub-m1", from:"Sneha",
    time:"18:05", day:"saturday",
    text:"TAKE MY MONEY"
  },
  {
    id:"bookclub-m2", from:"me", sent:true, read:true,
    time:"18:10", day:"saturday",
    text:"meeting at 11am sharp. no latecomers"
  },
  {
    id:"bookclub-m3", from:"Rohan",
    time:"11:00", day:"sunday",
    text:"book swap? i have 'sapiens' to lend"
  },
  {
    id:"bookclub-m4", from:"me", sent:true, read:true,
    time:"11:10", day:"sunday",
    text:"i'll take it! have 'kite runner' to swap"
  },
  {
    id:"bookclub-m5", from:"Divya",
    time:"11:15", day:"sunday",
    text:"i want the kite runner after you"
  },
  {
    id:"bookclub-m6", from:"Sneha",
    time:"11:20", day:"sunday",
    text:"queue system activated 📝"
  },
  {
    id:"bookclub-m7", from:"Sneha", starred:true,
    time:"16:00", day:"monday", type:"image",
    seed:"bookclub-bookshelf", caption:"my tbr pile is judging me 📚",
    text:"📷 my tbr pile is judging me 📚"
  },
  {
    id:"bookclub-m8", from:"Divya",
    time:"16:10", day:"monday",
    text:"that's not a pile, that's a lifestyle"
  },
  {
    id:"bookclub-m9", from:"Rohan",
    time:"16:12", day:"monday",
    text:"i count 14. rookie numbers"
  },
  {
    id:"bookclub-m10", from:"Divya",
    time:"12:00", day:"tuesday",
    text:"next pick: 'the midnight library'?"
  },
  {
    id:"bookclub-m11", from:"Sneha",
    time:"12:05", day:"tuesday",
    text:"seconded ✅"
  },
  {
    id:"bookclub-m12", from:"me", sent:true, read:true,
    time:"12:10", day:"tuesday",
    text:"thirded. starting tonight"
  },
  {
    id:"bookclub-m13", from:"Rohan",
    time:"12:15", day:"tuesday",
    text:"fine, but i'm picking next month"
  },
  {
    id:"bookclub-m14", from:"Rohan",
    time:"20:00", day:"yesterday",
    text:"hot take: 'atomic habits' is overrated"
  },
  {
    id:"bookclub-m15", from:"Divya",
    time:"20:02", day:"yesterday",
    text:"FIGHT ME"
  },
  {
    id:"bookclub-m16", from:"me", sent:true, read:true,
    time:"20:03", day:"yesterday",
    text:"🍿"
  },
  {
    id:"bookclub-m17", from:"Sneha",
    time:"20:05", day:"yesterday",
    text:"it's good but yes, overhyped"
  },
  {
    id:"bookclub-m18", from:"Rohan",
    time:"20:06", day:"yesterday",
    text:"see! sneha gets it"
  },
  {
    id:"bookclub-m19", from:"Sneha",
    time:"10:00", day:"today",
    text:"finished 'the palace of illusions' last night. 9/10 😭"
  },
  {
    id:"bookclub-m20", from:"Divya",
    time:"10:10", day:"today",
    text:"draupadi's pov was everything"
  },
  {
    id:"bookclub-m21", from:"Rohan",
    time:"10:15", day:"today",
    text:"adding to my list. currently on 'project hail mary'"
  },
  {
    id:"bookclub-m22", from:"me", sent:true, read:true,
    time:"10:20", day:"today",
    text:"that one's a page-turner 🚀"
  },
  {
    id:"bookclub-m23", from:"Sneha",
    time:"10:25", day:"today",
    text:"sunday meetup? 4pm, third wave?"
  },
  {
    id:"bookclub-m24", from:"Divya",
    time:"10:30", day:"today",
    text:"in 📚"
  }
  ];

  /* ----- Football FC ⚽ (group) ----- */
  byId.football.messages = [
  {
    id:"football-m0", from:"Farhan",
    time:"12:00", day:"saturday",
    text:"new jerseys arrived! sizes in the group"
  },
  {
    id:"football-m1", from:"Farhan",
    time:"12:05", day:"saturday", type:"image",
    seed:"football-jerseys", caption:"fresh kits 🔴⚪",
    text:"📷 fresh kits 🔴⚪"
  },
  {
    id:"football-m2", from:"Dev",
    time:"12:10", day:"saturday",
    text:"these look sick"
  },
  {
    id:"football-m3", from:"me", sent:true, read:true,
    time:"12:15", day:"saturday",
    text:"sunday debut let's gooo"
  },
  {
    id:"football-m4", from:"Dev", starred:true,
    time:"08:30", day:"sunday",
    text:"man of the match: kiran. 2 goals 🔥"
  },
  {
    id:"football-m5", from:"Kiran",
    time:"08:35", day:"sunday",
    text:"all me. no big deal 😎"
  },
  {
    id:"football-m6", from:"Arjun",
    time:"08:40", day:"sunday",
    text:"my assist though"
  },
  {
    id:"football-m7", from:"Farhan",
    time:"08:45", day:"sunday",
    text:"team effort guys"
  },
  {
    id:"football-m8", from:"Arjun",
    time:"20:00", day:"monday", type:"image",
    seed:"football-turf-night", caption:"last sunday's squad 📸",
    text:"📷 last sunday's squad 📸"
  },
  {
    id:"football-m9", from:"Farhan",
    time:"20:10", day:"monday",
    text:"we look like a real team"
  },
  {
    id:"football-m10", from:"Kiran",
    time:"20:12", day:"monday",
    text:"until we start playing"
  },
  {
    id:"football-m11", from:"me", sent:true, read:true,
    time:"20:15", day:"monday",
    text:"💀"
  },
  {
    id:"football-m12", from:"Kiran",
    time:"18:00", day:"tuesday",
    text:"practice thursday 6pm? work on set pieces"
  },
  {
    id:"football-m13", from:"Arjun",
    time:"18:05", day:"tuesday",
    text:"in"
  },
  {
    id:"football-m14", from:"Farhan",
    time:"18:10", day:"tuesday",
    text:"can't, will join sunday"
  },
  {
    id:"football-m15", from:"Dev",
    time:"18:15", day:"tuesday",
    text:"i'll come. need to fix my free kicks"
  },
  {
    id:"football-m16", from:"me", sent:true, read:true,
    time:"18:20", day:"tuesday",
    text:"your free kicks need an exorcism"
  },
  {
    id:"football-m17", from:"Dev",
    time:"18:22", day:"tuesday",
    text:"rude 😤"
  },
  {
    id:"football-m18", from:"Farhan",
    time:"22:30", day:"yesterday",
    text:"that match last night... what a comeback"
  },
  {
    id:"football-m19", from:"Arjun",
    time:"22:32", day:"yesterday",
    text:"90th minute winner!!"
  },
  {
    id:"football-m20", from:"Dev",
    time:"22:35", day:"yesterday",
    text:"i screamed so loud my neighbor knocked"
  },
  {
    id:"football-m21", from:"me", sent:true, read:true,
    time:"22:36", day:"yesterday",
    text:"worth it 😂"
  },
  {
    id:"football-m22", from:"Arjun",
    time:"09:00", day:"today",
    text:"turf booked for sunday 7am. be there or be square ⚽"
  },
  {
    id:"football-m23", from:"Farhan",
    time:"09:10", day:"today",
    text:"7am is inhumane but ok"
  },
  {
    id:"football-m24", from:"Dev",
    time:"09:15", day:"today",
    text:"in. bringing my new boots"
  },
  {
    id:"football-m25", from:"Kiran",
    time:"09:20", day:"today",
    text:"need 2 more players, asking in the society group"
  },
  {
    id:"football-m26", from:"me", sent:true, read:true,
    time:"09:25", day:"today",
    text:"i'll bring bibs"
  }
  ];

  /* ----- Old Project Archive (group, archived) ----- */
  byId.oldproj.messages = [
  {
    id:"oldproj-m0", from:"Vikram",
    time:"16:00", day:"thursday",
    text:"atlas retrospective notes — sharing for the memories"
  },
  {
    id:"oldproj-m1", from:"Vikram",
    time:"16:05", day:"thursday", type:"doc",
    filename:"atlas-retro-notes.pdf", size:"480 KB",
    text:"📄 atlas-retro-notes.pdf"
  },
  {
    id:"oldproj-m2", from:"Rahul",
    time:"16:10", day:"thursday",
    text:"we shipped in 6 weeks. not bad at all"
  },
  {
    id:"oldproj-m3", from:"me", sent:true, read:true,
    time:"16:15", day:"thursday",
    text:"nova better watch out"
  },
  {
    id:"oldproj-m4", from:"Rahul",
    time:"18:00", day:"friday",
    text:"farewell lunch tomorrow? 1pm, the usual place"
  },
  {
    id:"oldproj-m5", from:"Vikram",
    time:"18:05", day:"friday",
    text:"in 🍱"
  },
  {
    id:"oldproj-m6", from:"me", sent:true, read:true,
    time:"18:10", day:"friday",
    text:"in. first round's on me"
  },
  {
    id:"oldproj-m7", from:"Rahul",
    time:"18:15", day:"friday",
    text:"archiving this group on monday. memories 🥲"
  },
  {
    id:"oldproj-m8", from:"Vikram",
    time:"14:00", day:"saturday",
    text:"last bug fixed. i'm emotional"
  },
  {
    id:"oldproj-m9", from:"Rahul",
    time:"14:05", day:"saturday",
    text:"don't cry, it's just code"
  },
  {
    id:"oldproj-m10", from:"me", sent:true, read:true,
    time:"14:10", day:"saturday",
    text:"pour one out for the staging server"
  },
  {
    id:"oldproj-m11", from:"Rahul",
    time:"20:00", day:"sunday",
    text:"final deploy done. no rollbacks needed 🎉"
  },
  {
    id:"oldproj-m12", from:"me", sent:true, read:true,
    time:"20:05", day:"sunday",
    text:"a clean final deploy. historic"
  },
  {
    id:"oldproj-m13", from:"Vikram",
    time:"20:10", day:"sunday",
    text:"screenshotting this for the portfolio"
  },
  {
    id:"oldproj-m14", from:"Rahul",
    time:"17:00", day:"monday",
    text:"alright team, that's a wrap on Project Atlas 🎬"
  },
  {
    id:"oldproj-m15", from:"Vikram",
    time:"17:05", day:"monday",
    text:"repo archived. it's been real"
  },
  {
    id:"oldproj-m16", from:"me", sent:true, read:true,
    time:"17:10", day:"monday",
    text:"great working with you both! onto nova 🚀"
  },
  {
    id:"oldproj-m17", from:"Rahul",
    time:"17:15", day:"monday",
    text:"handover doc is in the drive, all green"
  },
  {
    id:"oldproj-m18", from:"Vikram",
    time:"17:20", day:"monday",
    text:"client signed off. we did good"
  }
  ];
};
