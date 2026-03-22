import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean up existing data
  await prisma.review.deleteMany()
  await prisma.location.deleteMany()
  await prisma.user.deleteMany()

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12)

  const alice = await prisma.user.create({
    data: {
      email: 'alice@virginia.edu',
      name: 'Alice Johnson',
      password: hashedPassword,
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@unc.edu',
      name: 'Bob Smith',
      password: hashedPassword,
    },
  })

  const carol = await prisma.user.create({
    data: {
      email: 'carol@duke.edu',
      name: 'Carol Williams',
      password: hashedPassword,
    },
  })

  const dave = await prisma.user.create({
    data: {
      email: 'dave@mit.edu',
      name: 'Dave Brown',
      password: hashedPassword,
    },
  })

  const emma = await prisma.user.create({
    data: {
      email: 'emma@stanford.edu',
      name: 'Emma Davis',
      password: hashedPassword,
    },
  })

  console.log('Users created.')

  // Create locations
  const locations = await Promise.all([
    // Campus Spots
    prisma.location.create({
      data: {
        name: 'The Lawn',
        description:
          'The iconic central lawn of the university — a sprawling green space perfect for studying, frisbee, or just soaking in the collegiate atmosphere. Surrounded by historic colonnaded pavilions, this is the heart of campus life.',
        category: 'CAMPUS_SPOT',
        address: 'University Avenue, Central Campus',
        imageUrl:
          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
        vibes: JSON.stringify(['Chill', 'Study-Friendly', 'Social', 'Outdoorsy']),
        priceLevel: 'FREE',
        university: 'University of Virginia',
        avgWaitMinutes: 0,
        avgRating: 0,
        reviewCount: 0,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Main Library',
        description:
          'The grand university library featuring multiple floors of study space, from quiet reading rooms to collaborative group areas. Home to thousands of volumes and exceptional research resources.',
        category: 'CAMPUS_SPOT',
        address: '1st Floor, Central Library Building',
        imageUrl:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
        vibes: JSON.stringify(['Chill', 'Study-Friendly']),
        priceLevel: 'FREE',
        university: 'University of Virginia',
        avgWaitMinutes: 0,
        avgRating: 0,
        reviewCount: 0,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Student Union Plaza',
        description:
          'The bustling heart of student social life. Features food vendors, outdoor seating, and a stage for student events. Always something happening here — from club fairs to spontaneous jam sessions.',
        category: 'CAMPUS_SPOT',
        address: 'Student Union Building, Main Entrance',
        imageUrl:
          'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80',
        vibes: JSON.stringify(['Lively', 'Social']),
        priceLevel: 'FREE',
        university: 'Duke University',
        avgWaitMinutes: 0,
        avgRating: 0,
        reviewCount: 0,
      },
    }),

    // Restaurants
    prisma.location.create({
      data: {
        name: 'The Collegiate Café',
        description:
          'A beloved campus staple serving hearty breakfasts and lunches. Known for their famous grilled cheese and tomato soup combo. The exposed brick walls and vintage university memorabilia make this a cozy retreat.',
        category: 'RESTAURANT',
        address: '42 College Street, Downtown',
        imageUrl:
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
        vibes: JSON.stringify(['Chill', 'Study-Friendly', 'Social']),
        priceLevel: 'DOLLAR',
        university: 'University of Virginia',
        avgWaitMinutes: 0,
        avgRating: 0,
        reviewCount: 0,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Ramen Republic',
        description:
          'Authentic Japanese ramen shop that has become a campus institution. The rich tonkotsu broth simmers for 18 hours and the portion sizes are legendary. Late-night study fuel at its finest.',
        category: 'RESTAURANT',
        address: '117 University Blvd, Near Campus',
        imageUrl:
          'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
        vibes: JSON.stringify(['Lively', 'Social']),
        priceLevel: 'TWO_DOLLAR',
        university: 'Duke University',
        avgWaitMinutes: 0,
        avgRating: 0,
        reviewCount: 0,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Rooftop Tacos',
        description:
          'Trendy rooftop taco bar with stunning city views. Craft cocktails, fresh guacamole, and a rotating menu of creative tacos make this the go-to spot for weekend dinners and celebrations.',
        category: 'RESTAURANT',
        address: '8 Skyline Drive, Downtown District',
        imageUrl:
          'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
        vibes: JSON.stringify(['Lively', 'Social', 'Romantic']),
        priceLevel: 'THREE_DOLLAR',
        university: 'University of North Carolina',
        avgWaitMinutes: 0,
        avgRating: 0,
        reviewCount: 0,
      },
    }),

    // Attractions
    prisma.location.create({
      data: {
        name: 'Riverside Trail',
        description:
          'A scenic 5-mile trail winding along the river through forests and meadows. Perfect for morning runs, evening strolls, or weekend adventures. Stunning fall foliage and frequent wildlife sightings.',
        category: 'ATTRACTION',
        address: 'River Road Trailhead, 2 miles from campus',
        imageUrl:
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
        vibes: JSON.stringify(['Chill', 'Outdoorsy', 'Adventurous', 'Romantic']),
        priceLevel: 'FREE',
        university: 'University of Virginia',
        avgWaitMinutes: 0,
        avgRating: 0,
        reviewCount: 0,
      },
    }),
    prisma.location.create({
      data: {
        name: 'City Art Museum',
        description:
          'World-class art museum with rotating exhibitions featuring both classic and contemporary works. Students get free admission with valid ID. The sculpture garden is a hidden gem for afternoon relaxation.',
        category: 'ATTRACTION',
        address: '200 Cultural Center Drive, Museum District',
        imageUrl:
          'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
        vibes: JSON.stringify(['Chill', 'Romantic', 'Social']),
        priceLevel: 'FREE',
        university: 'Duke University',
        avgWaitMinutes: 0,
        avgRating: 0,
        reviewCount: 0,
      },
    }),
  ])

  console.log('Locations created.')

  // Reviews for The Lawn (locations[0])
  const lawnReviews = [
    { rating: 5, body: 'Absolutely love hanging out here between classes. The vibe is unmatched — reading on a warm afternoon with other students around is peak college experience.', waitMinutes: 0, vibes: ['Chill', 'Outdoorsy'], userId: alice.id },
    { rating: 5, body: 'Perfect spot for group study sessions when the weather is nice. Brought a blanket and spent three hours here without realizing it.', waitMinutes: 0, vibes: ['Study-Friendly', 'Social'], userId: bob.id },
    { rating: 4, body: 'Beautiful space. Gets crowded during peak hours but there\'s always room. The squirrels are aggressively friendly though.', waitMinutes: 0, vibes: ['Chill', 'Outdoorsy'], userId: carol.id },
    { rating: 5, body: 'Historic and gorgeous. You feel the weight of university tradition here. Highly recommend coming early morning when it\'s quiet.', waitMinutes: 0, vibes: ['Chill', 'Romantic'], userId: dave.id },
    { rating: 4, body: 'Great for frisbee and casual hangouts. Wish there were more trash cans but overall a fantastic campus spot.', waitMinutes: 0, vibes: ['Social', 'Outdoorsy'], userId: emma.id },
    { rating: 5, body: 'My absolute favorite place on campus. Rain or shine, there\'s always energy here. The fall foliage is stunning.', waitMinutes: 0, vibes: ['Chill', 'Outdoorsy'], userId: alice.id },
    { rating: 3, body: 'Nice enough but can get very crowded during events. Hard to find a quiet corner when there\'s something going on.', waitMinutes: 0, vibes: ['Social'], userId: bob.id },
  ]

  // Reviews for Main Library (locations[1])
  const libraryReviews = [
    { rating: 5, body: 'The quiet study rooms on the 4th floor are GOLD. Reserve them early, they fill up fast before midterms. Perfect for deep focus work.', waitMinutes: 5, vibes: ['Study-Friendly', 'Chill'], userId: carol.id },
    { rating: 4, body: 'Excellent resources and very helpful staff. The collection is impressive. Only downside is the Wi-Fi can be spotty on upper floors.', waitMinutes: 10, vibes: ['Study-Friendly'], userId: dave.id },
    { rating: 5, body: 'Stayed here from 9am to midnight during finals week and the staff were incredibly accommodating. Best library I\'ve ever studied in.', waitMinutes: 5, vibes: ['Study-Friendly', 'Chill'], userId: emma.id },
    { rating: 4, body: 'Love the different zones — quiet areas, group areas, computer lab. Something for everyone. The coffee cart in the lobby is a lifesaver.', waitMinutes: 5, vibes: ['Study-Friendly', 'Chill'], userId: alice.id },
    { rating: 3, body: 'Gets packed during exam season. Some people don\'t respect the quiet zones which is frustrating. Good resources though.', waitMinutes: 15, vibes: ['Study-Friendly'], userId: bob.id },
    { rating: 5, body: 'The architecture alone is worth visiting. Incredible building with plenty of hidden nooks. The special collections floor is amazing.', waitMinutes: 5, vibes: ['Chill', 'Study-Friendly'], userId: carol.id },
  ]

  // Reviews for Student Union Plaza (locations[2])
  const unionReviews = [
    { rating: 4, body: 'Always something going on. Great food trucks on Fridays. Perfect place to meet people and feel connected to campus community.', waitMinutes: 10, vibes: ['Lively', 'Social'], userId: dave.id },
    { rating: 5, body: 'The outdoor concerts in fall are incredible. Stumbled upon a jazz performance last week that completely made my day.', waitMinutes: 5, vibes: ['Lively', 'Social'], userId: emma.id },
    { rating: 4, body: 'Energetic spot with lots of seating. Great for people watching. Food options are decent and affordable for students.', waitMinutes: 10, vibes: ['Lively', 'Social'], userId: alice.id },
    { rating: 3, body: 'Can be overwhelming if you just want a quiet lunch. Very loud during peak hours. But if you\'re in a social mood, it\'s perfect.', waitMinutes: 15, vibes: ['Lively'], userId: bob.id },
    { rating: 5, body: 'This is where the pulse of campus beats. Club recruitment, concerts, food, friends — everything happens here.', waitMinutes: 5, vibes: ['Lively', 'Social'], userId: carol.id },
  ]

  // Reviews for The Collegiate Café (locations[3])
  const cafeReviews = [
    { rating: 5, body: 'The grilled cheese here is transcendent. Seriously the best comfort food near campus. Staff remembers your name after two visits.', waitMinutes: 10, vibes: ['Chill', 'Social'], userId: dave.id },
    { rating: 5, body: 'Perfect study café — good Wi-Fi, never too crowded, and the coffee keeps coming. Their avocado toast hits different.', waitMinutes: 8, vibes: ['Study-Friendly', 'Chill'], userId: emma.id },
    { rating: 4, body: 'Lovely atmosphere with the brick walls and vintage photos. Lunch specials are a great deal for students. Parking is the only issue.', waitMinutes: 12, vibes: ['Chill', 'Social'], userId: alice.id },
    { rating: 5, body: 'My go-to for first dates and meeting with professors. Warm, cozy, never too loud. The chocolate chip cookies are dangerous.', waitMinutes: 10, vibes: ['Chill', 'Romantic'], userId: bob.id },
    { rating: 4, body: 'Solid brunch spot. The eggs benedict on weekends is worth the slight wait. Prices are very reasonable for the quality.', waitMinutes: 20, vibes: ['Social', 'Chill'], userId: carol.id },
    { rating: 3, body: 'Good food but can be slow when busy. The weekend brunch rush is real. Call ahead or arrive before noon.', waitMinutes: 30, vibes: ['Chill'], userId: dave.id },
  ]

  // Reviews for Ramen Republic (locations[4])
  const ramenReviews = [
    { rating: 5, body: 'Best ramen I\'ve had outside of Japan. The tonkotsu broth is life-changing. Late night hours are a gift to sleep-deprived students.', waitMinutes: 20, vibes: ['Lively', 'Social'], userId: emma.id },
    { rating: 5, body: 'Portions are HUGE. Came here after a brutal exam week and it genuinely healed me. The chashu pork is melt-in-your-mouth perfect.', waitMinutes: 25, vibes: ['Lively'], userId: alice.id },
    { rating: 4, body: 'Amazing flavor but expect a wait on weekends. Totally worth it. The gyoza appetizers are also phenomenal.', waitMinutes: 35, vibes: ['Lively', 'Social'], userId: bob.id },
    { rating: 5, body: 'This place runs on college student schedules. Open until 2am on weekends, which is a genuine public service.', waitMinutes: 20, vibes: ['Lively', 'Social'], userId: carol.id },
    { rating: 4, body: 'Authentic and delicious. The spicy miso ramen is my go-to. Staff is friendly and efficient despite how busy it gets.', waitMinutes: 30, vibes: ['Lively'], userId: dave.id },
    { rating: 3, body: 'Tasty but small space means long waits on busy nights. Go on weekday evenings for best experience. Still worth it for the broth.', waitMinutes: 40, vibes: ['Lively'], userId: emma.id },
    { rating: 5, body: 'A campus institution for a reason. The loyalty card program is clutch — free bowl every 10 visits adds up quickly.', waitMinutes: 25, vibes: ['Social', 'Lively'], userId: alice.id },
  ]

  // Reviews for Rooftop Tacos (locations[5])
  const tacoReviews = [
    { rating: 5, body: 'The view from the rooftop is stunning, especially at sunset. Perfect for celebrating end of semester or birthdays. The mango habanero tacos are exceptional.', waitMinutes: 25, vibes: ['Lively', 'Romantic', 'Social'], userId: bob.id },
    { rating: 4, body: 'Pricier than the average student spot but completely worth it for special occasions. The mezcal cocktails are crafted beautifully.', waitMinutes: 30, vibes: ['Romantic', 'Lively'], userId: carol.id },
    { rating: 5, body: 'Went here for my birthday dinner and it was perfect. Rooftop views, craft drinks, incredible food. Staff made us feel really special.', waitMinutes: 20, vibes: ['Romantic', 'Social', 'Lively'], userId: dave.id },
    { rating: 4, body: 'Love the ambiance and creativity of the menu. Tacos change seasonally which keeps things exciting. Worth saving up for.', waitMinutes: 25, vibes: ['Lively', 'Social'], userId: emma.id },
    { rating: 3, body: 'Beautiful location but the prices are steep and portions are small. Better for drinks than a full meal. Still, the vibe is unmatched.', waitMinutes: 35, vibes: ['Romantic', 'Lively'], userId: alice.id },
    { rating: 5, body: 'Took my parents here when they visited and they were blown away. The city views at night are romantic and the food is genuinely excellent.', waitMinutes: 20, vibes: ['Romantic', 'Social'], userId: bob.id },
  ]

  // Reviews for Riverside Trail (locations[6])
  const trailReviews = [
    { rating: 5, body: 'My daily morning run route. Nothing beats watching the sunrise over the river while getting your steps in. Absolutely gorgeous in every season.', waitMinutes: 0, vibes: ['Outdoorsy', 'Chill'], userId: carol.id },
    { rating: 5, body: 'Brought my bike and spent 3 hours exploring. Well-maintained trail with clear markers. Saw a family of deer near the 3-mile mark!', waitMinutes: 0, vibes: ['Outdoorsy', 'Adventurous'], userId: dave.id },
    { rating: 4, body: 'Perfect stress reliever during finals. The sound of the river is meditative. Wear good shoes as some parts get muddy after rain.', waitMinutes: 0, vibes: ['Chill', 'Outdoorsy'], userId: emma.id },
    { rating: 5, body: 'Took a first date here and it was magical. The river view benches are perfect for conversation. Fall colors are breathtaking.', waitMinutes: 0, vibes: ['Romantic', 'Outdoorsy'], userId: alice.id },
    { rating: 4, body: 'Great trail for all fitness levels. The easy path near the river entrance is perfect for casual strollers. More challenging sections further in.', waitMinutes: 0, vibes: ['Outdoorsy', 'Adventurous'], userId: bob.id },
    { rating: 5, body: 'This trail has become my sanctuary. Whenever campus stress gets overwhelming, a walk here resets everything. Cannot recommend enough.', waitMinutes: 0, vibes: ['Chill', 'Outdoorsy', 'Adventurous'], userId: carol.id },
    { rating: 4, body: 'Perfect for evening runs when it\'s not too hot. The lighting could be better in some sections at night but overall excellent.', waitMinutes: 0, vibes: ['Outdoorsy'], userId: dave.id },
  ]

  // Reviews for City Art Museum (locations[7])
  const museumReviews = [
    { rating: 5, body: 'Free with student ID and the collection is world-class. The impressionist gallery is stunning. Perfect rainy day activity.', waitMinutes: 10, vibes: ['Chill', 'Romantic'], userId: emma.id },
    { rating: 5, body: 'The rotating exhibitions are always fresh and interesting. Went three times this semester for different shows. The gift shop has great prints.', waitMinutes: 15, vibes: ['Social', 'Chill'], userId: alice.id },
    { rating: 4, body: 'Excellent museum but can get crowded on weekends. Weekday afternoons are ideal. The sculpture garden is a hidden gem for lunch.', waitMinutes: 20, vibes: ['Chill', 'Romantic'], userId: bob.id },
    { rating: 5, body: 'Took my art history class here and the docent tour was exceptional. Even if you\'re not an art person, this museum makes you one.', waitMinutes: 15, vibes: ['Social', 'Chill'], userId: carol.id },
    { rating: 4, body: 'Beautiful building and impressive collection. The modern art wing has some controversial pieces that sparked great discussion. Love this place.', waitMinutes: 10, vibes: ['Chill', 'Social'], userId: dave.id },
    { rating: 5, body: 'The museum café is also fantastic — great for a study date. Peaceful atmosphere and the courtyard has amazing natural light.', waitMinutes: 15, vibes: ['Romantic', 'Chill'], userId: emma.id },
    { rating: 3, body: 'Good museum but the audio guide app keeps crashing. Physical maps are outdated. Content is excellent, infrastructure needs work.', waitMinutes: 10, vibes: ['Chill'], userId: alice.id },
    { rating: 5, body: 'Night at the Museum events on Fridays are incredible. Live music, student discounts on cocktails, and art. Best date night option near campus.', waitMinutes: 20, vibes: ['Romantic', 'Social', 'Lively'], userId: bob.id },
  ]

  const allReviewData = [
    { reviews: lawnReviews, locationIndex: 0 },
    { reviews: libraryReviews, locationIndex: 1 },
    { reviews: unionReviews, locationIndex: 2 },
    { reviews: cafeReviews, locationIndex: 3 },
    { reviews: ramenReviews, locationIndex: 4 },
    { reviews: tacoReviews, locationIndex: 5 },
    { reviews: trailReviews, locationIndex: 6 },
    { reviews: museumReviews, locationIndex: 7 },
  ]

  for (const { reviews, locationIndex } of allReviewData) {
    const location = locations[locationIndex]
    let totalRating = 0
    let totalWait = 0

    for (const review of reviews) {
      await prisma.review.create({
        data: {
          rating: review.rating,
          body: review.body,
          waitMinutes: review.waitMinutes,
          vibes: JSON.stringify(review.vibes),
          userId: review.userId,
          locationId: location.id,
        },
      })
      totalRating += review.rating
      totalWait += review.waitMinutes
    }

    const avgRating = totalRating / reviews.length
    const avgWaitMinutes = totalWait / reviews.length

    await prisma.location.update({
      where: { id: location.id },
      data: {
        avgRating,
        avgWaitMinutes,
        reviewCount: reviews.length,
      },
    })
  }

  console.log('Reviews created and location stats updated.')
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
