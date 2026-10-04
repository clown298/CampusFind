const pool = require('./config/db')
const { ensureSchema } = require('./config/schema')

const DEMO_CONTACT = 'Campus Lost & Found Office'

const REMOVE_V20260903_DEMO = true
const INSTALL_V20260903_DEMO = false

const DEMO_LOST_ITEMS = [
  {
    itemName: 'Black Leather Wallet',
    category: 'Accessories',
    description: 'Black leather bifold wallet with card slots and a small coin pocket.',
    location: 'Library',
    dateLost: '2026-08-29',
  },
  {
    itemName: 'Silver Scientific Calculator',
    category: 'Electronics',
    description: 'Silver scientific calculator with a lightly scratched screen.',
    location: 'Mechanical Department',
    dateLost: '2026-08-21',
  },
  {
    itemName: 'Blue College Backpack',
    category: 'Accessories',
    description: 'Navy blue college backpack with a small logo on the front.',
    location: 'Canteen',
    dateLost: '2026-08-12',
  },
  {
    itemName: 'Engineering Drawing Kit',
    category: 'Other',
    description: 'Engineering drawing kit with a compass, divider, and pencils in a brown case.',
    location: 'Classroom Number 10',
    dateLost: '2026-07-27',
  },
  {
    itemName: 'Wireless Earbuds Case',
    category: 'Electronics',
    description: 'White wireless earbuds charging case with a short charging cable.',
    location: 'Mechanical Department',
    dateLost: '2026-07-14',
  },
  {
    itemName: 'GCOEC Student ID Card',
    category: 'Documents',
    description: 'College student ID card with the holder photo and enrollment number.',
    location: 'Library',
    dateLost: '2026-06-30',
  },
]

const DEMO_FOUND_ITEMS = [
  {
    itemName: 'Red Water Bottle',
    category: 'Other',
    description: 'Red plastic water bottle with a black screw cap.',
    location: 'Auditorium',
    dateFound: '2026-08-25',
  },
  {
    itemName: 'Black USB Flash Drive',
    category: 'Electronics',
    description: 'Black USB flash drive with a white stripe and a lanyard loop.',
    location: 'Mechanical Department',
    dateFound: '2026-08-09',
  },
  {
    itemName: 'Brown Notebook',
    category: 'Books',
    description: 'Brown spiral notebook with graph paper pages and handwritten notes.',
    location: 'Library',
    dateFound: '2026-07-22',
  },
  {
    itemName: 'Silver Keychain with Two Keys',
    category: 'Keys',
    description: 'Silver keychain ring holding two keys and a small round tag.',
    location: 'Canteen',
    dateFound: '2026-06-18',
  },
]

async function removeKnownTestRecords() {
  const result = await pool.query(
    `DELETE FROM lost_items
     WHERE (item_name = 'Test Wallet' AND description LIKE 'Black wallet for database testing')
        OR (item_name = 'Phone' AND description LIKE 'a smartphone with black cover solid wallpaper.%')`
  )
  return result.rowCount
}

async function removeV20260903DemoRecord(table, dateColumn, record) {
  const dateValue = record[dateColumn === 'date_lost' ? 'dateLost' : 'dateFound']
  const result = await pool.query(
    `DELETE FROM ${table}
     WHERE item_name = $1
       AND category = $2
       AND location = $3
       AND ${dateColumn} = $4
       AND user_id IS NULL`,
    [record.itemName, record.category, record.location, dateValue]
  )
  return result.rowCount
}

async function removeV20260903DemoRecords() {
  let totalRemoved = 0
  for (const record of DEMO_LOST_ITEMS) {
    totalRemoved += await removeV20260903DemoRecord('lost_items', 'date_lost', record)
  }
  for (const record of DEMO_FOUND_ITEMS) {
    totalRemoved += await removeV20260903DemoRecord('found_items', 'date_found', record)
  }
  return totalRemoved
}

async function demoRecordExists(table, dateColumn, record) {
  const dateValue = record[dateColumn === 'date_lost' ? 'dateLost' : 'dateFound']
  const result = await pool.query(
    `SELECT 1 FROM ${table}
     WHERE item_name = $1 AND category = $2 AND location = $3 AND ${dateColumn} = $4
     LIMIT 1`,
    [record.itemName, record.category, record.location, dateValue]
  )
  return result.rowCount > 0
}

async function insertDemoRecord(table, dateColumn, record) {
  const dateValue = record[dateColumn === 'date_lost' ? 'dateLost' : 'dateFound']
  await pool.query(
    `INSERT INTO ${table} (item_name, category, description, location, ${dateColumn}, contact)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      record.itemName,
      record.category,
      record.description,
      record.location,
      dateValue,
      DEMO_CONTACT,
    ]
  )
}

async function runSeed() {
  await ensureSchema()

  const removed = await removeKnownTestRecords()
  if (removed > 0) {
    console.log(`Removed ${removed} known test record(s) from lost_items.`)
  }

  let legacyRemoved = 0
  if (REMOVE_V20260903_DEMO) {
    legacyRemoved = await removeV20260903DemoRecords()
    if (legacyRemoved > 0) {
      console.log(
        `Removed ${legacyRemoved} legacy campusfind:seed:v20260903 demo record(s).`
      )
    }
  }

  let lostInserted = 0
  let foundInserted = 0
  if (INSTALL_V20260903_DEMO) {
    for (const record of DEMO_LOST_ITEMS) {
      const exists = await demoRecordExists('lost_items', 'date_lost', record)
      if (exists) continue
      await insertDemoRecord('lost_items', 'date_lost', record)
      lostInserted += 1
    }

    for (const record of DEMO_FOUND_ITEMS) {
      const exists = await demoRecordExists('found_items', 'date_found', record)
      if (exists) continue
      await insertDemoRecord('found_items', 'date_found', record)
      foundInserted += 1
    }
  }

  console.log(
    `Seed complete. Legacy demo records removed: ${legacyRemoved}, Lost demo records inserted: ${lostInserted}, Found demo records inserted: ${foundInserted}.`
  )

  return {
    removed,
    legacyRemoved,
    lostInserted,
    foundInserted,
  }
}

module.exports = { runSeed, DEMO_LOST_ITEMS, DEMO_FOUND_ITEMS }

if (require.main === module) {
  runSeed()
    .then(() => pool.end())
    .catch((error) => {
      console.error('Seed failed:', error.message)
      process.exit(1)
    })
}