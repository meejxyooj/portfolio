# Audio Transcription App

A Gradio-based web application that transcribes audio files using the OpenAI Whisper API.

## Features

- Upload audio files directly in the browser
- Transcription powered by OpenAI Whisper (`whisper-1` model)
- View the full transcript in an editable text area
- Download the transcript as a `.txt` file
- Secure: API key is entered per-session and never stored

## Supported Formats

`mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, `webm`

Maximum file size: **25 MB** (OpenAI Whisper limit)

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the app

```bash
python app.py
```

The app will be available at `http://localhost:7860`.

## Usage

1. Enter your [OpenAI API key](https://platform.openai.com/api-keys) in the API Key field.
2. Upload an audio file using the upload widget.
3. Click **Transcribe** and wait for the result.
4. Edit the transcript if needed, then click **Prepare Download** to get a `.txt` file.

## Requirements

- Python 3.8+
- An OpenAI account with access to the Whisper API
