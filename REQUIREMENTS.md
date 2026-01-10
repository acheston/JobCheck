# JobCheck - Requirements & Reference Document

## Overview

JobCheck is a web application that monitors people for job changes and sends alerts when a job change is detected. Users can add people to a monitoring list and track their career progression over time.

## Features

### Core Features

1. **Person List Display**
   - Shows all monitored people in a card-based layout
   - Each card displays: name, current role, company, profile image, last checked date
   - Indicates number of previous roles in job history

2. **Add Person Workflow**
   - Two-step modal interface
   - Step 1: Enter person's name and current company
   - Step 2: Review search results with name, role, and image from Serper API
   - Options to add to list or search again

3. **Job History Tracking**
   - Stores current job and historical positions
   - Each job record includes: company, role, start date, end date
   - History displayed in chronological order (most recent first)

4. **Person Management**
   - Delete people from monitoring list
   - Data persisted in JSON file

## Tech Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Styling**: Plain CSS (no framework)
- **State Management**: React useState/useEffect hooks

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Data Storage**: JSON file (`server/data/people.json`)

### External APIs
- **Serper API** (https://serper.dev): Google search API for finding person information

## Project Structure

```
JobCheck/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── PersonList.jsx      # List container
│   │   │   ├── PersonList.css
│   │   │   ├── PersonCard.jsx      # Individual person card
│   │   │   ├── PersonCard.css
│   │   │   ├── AddPersonModal.jsx  # Two-step add modal
│   │   │   └── AddPersonModal.css
│   │   ├── App.jsx                 # Main app component
│   │   ├── App.css
│   │   ├── index.css               # Global styles
│   │   └── main.jsx                # React entry point
│   ├── index.html
│   └── package.json
├── server/                    # Node.js backend
│   ├── index.js               # Express server entry
│   ├── routes/
│   │   ├── people.js          # CRUD endpoints for people
│   │   └── search.js          # Serper search endpoint
│   ├── services/
│   │   ├── dataStore.js       # JSON file read/write
│   │   └── serper.js          # Serper API integration
│   ├── data/
│   │   └── people.json        # Data storage
│   └── package.json
├── REQUIREMENTS.md            # This file
└── README.md                  # Setup instructions
```

## Data Model

### Person Object

```json
{
  "id": "uuid-string",
  "name": "Jane Smith",
  "imageUrl": "https://example.com/photo.jpg",
  "lastChecked": "10/01/2026",
  "currentJob": {
    "company": "Acme Corp",
    "role": "VP of Engineering",
    "startDate": "01/06/2024"
  },
  "jobHistory": [
    {
      "company": "Previous Company",
      "role": "Senior Engineer",
      "startDate": "01/03/2021",
      "endDate": "01/06/2024"
    }
  ]
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/people` | Get all monitored people |
| GET | `/api/people/:id` | Get a single person by ID |
| POST | `/api/people` | Add a new person |
| PUT | `/api/people/:id` | Update a person (job change) |
| DELETE | `/api/people/:id` | Remove a person |
| POST | `/api/search` | Search Serper for person info |
| GET | `/api/health` | Health check endpoint |

### POST /api/people - Request Body

```json
{
  "name": "John Doe",
  "company": "Acme Corp",
  "role": "Software Engineer",
  "imageUrl": "https://example.com/photo.jpg"
}
```

### POST /api/search - Request Body

```json
{
  "name": "John Doe",
  "company": "Acme Corp"
}
```

### POST /api/search - Response

```json
{
  "name": "John Doe",
  "company": "Acme Corp",
  "role": "Software Engineer",
  "imageUrl": "https://example.com/photo.jpg",
  "source": "knowledgeGraph",
  "rawResults": [
    {
      "title": "John Doe - LinkedIn",
      "snippet": "Software Engineer at Acme Corp...",
      "link": "https://linkedin.com/in/johndoe"
    }
  ]
}
```

## Environment Variables

### Server (.env)

```
SERPER_API_KEY=your_serper_api_key_here
PORT=3001
```

## Development Setup

1. **Get Serper API Key**
   - Sign up at https://serper.dev
   - Copy your API key

2. **Configure Environment**
   - Create `server/.env` file
   - Add your `SERPER_API_KEY`

3. **Install Dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd server && npm run dev

   # Terminal 2: Frontend
   cd client && npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## Future Enhancements

- [ ] Automatic job change detection with scheduled checks
- [ ] Email/notification alerts when job changes detected
- [ ] View detailed job history for each person
- [ ] Edit person information
- [ ] Search/filter people list
- [ ] Export monitoring data
- [ ] LinkedIn integration for more accurate data

## Design Decisions

1. **JSON vs CSV Storage**: Chose JSON for nested job history data
2. **Serper vs SerpApi**: Chose Serper for simpler API and pricing
3. **No UI Framework**: Plain CSS keeps bundle small and flexible
4. **Two-Step Modal**: Confirms search results before adding to prevent errors
