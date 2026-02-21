# tp1-test-logiciel

This repository contains two main projects:

-   **Frontend (Angular)** → `CineWay-Projet-Angular` ( includes tests )
-   **Backend (FastAPI + PostgreSQL)** → `cinema-ticket-selling-api`

------------------------------------------------------------------------

# 1) Backend Setup (FastAPI)

Open a terminal and navigate to the backend folder:

``` bash
cd cinema-ticket-selling-api
```

## Step 1 --- Create virtual environment

``` bash
python -m venv venv
```

## Step 2 --- Activate virtual environment

Windows:

``` bash
venv\Scripts\activate
```

Mac/Linux:

``` bash
source venv/bin/activate
```

## Step 3 --- Install dependencies

``` bash
pip install -r requirements.txt
```

## Step 4 --- Configure environment variables

Copy the example environment file:

Windows:

``` bash
copy .env.example .env
```

Mac/Linux:

``` bash
cp .env.example .env
```

Edit `.env` file and update:

-   DATABASE_URL
-   PostgreSQL username
-   PostgreSQL password

Example:

    DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/cinema_db

## Step 5 --- Seed database

``` bash
python seed.py
```

## Step 6 --- Run the backend server

``` bash
uvicorn app.main:app --reload
```

The API will run at:

    http://localhost:8000

The backend **must be running** before executing Angular integration
tests.

------------------------------------------------------------------------

#  2) Frontend Setup (Angular)

Open another terminal and navigate to:

``` bash
cd CineWay-Projet-Angular
```

## Step 1 --- Install dependencies

``` bash
npm install
```

------------------------------------------------------------------------

# 3) Running Tests (Vitest)

All tests are located inside:

    src/test/**/*.test.js

To run tests with coverage:

``` bash
npm run test:vitest:coverage
```

This will:

-   Run unit tests (pipes) : movie-duration.pipe and time-tohours-pipe
-   Run integration API tests (real HTTP calls) : movie-api.test.js
-   Generate coverage report

------------------------------------------------------------------------

# Exemple 

<img width="955" height="597" alt="image" src="https://github.com/user-attachments/assets/773e8711-eaf0-48b8-883f-aff33f1895aa" />
