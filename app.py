import gradio as gr
import openai
import os
import tempfile


def transcribe_audio(audio_file, api_key):
    """
    Transcribe an audio file using OpenAI Whisper API.

    Args:
        audio_file: Path to the uploaded audio file
        api_key: OpenAI API key

    Returns:
        Tuple of (transcript text, status message)
    """
    if not api_key or api_key.strip() == "":
        return "", "Error: Please provide your OpenAI API key."

    if audio_file is None:
        return "", "Error: Please upload an audio file."

    try:
        client = openai.OpenAI(api_key=api_key.strip())

        with open(audio_file, "rb") as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text",
            )

        return transcript, "Transcription complete."

    except openai.AuthenticationError:
        return "", "Error: Invalid API key. Please check your OpenAI API key."
    except openai.RateLimitError:
        return "", "Error: Rate limit exceeded. Please try again later."
    except openai.BadRequestError as e:
        return "", f"Error: Unsupported file format or bad request. {str(e)}"
    except Exception as e:
        return "", f"Error: {str(e)}"


def save_transcript(transcript_text):
    """
    Save the transcript to a temporary text file for download.

    Args:
        transcript_text: The transcript content

    Returns:
        Path to the saved file, or None if transcript is empty
    """
    if not transcript_text or transcript_text.strip() == "":
        return None

    tmp = tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".txt",
        delete=False,
        prefix="transcript_",
    )
    tmp.write(transcript_text)
    tmp.flush()
    return tmp.name


# --- Gradio UI ---

with gr.Blocks(title="Audio Transcription App", theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        """
        # Audio Transcription App
        Upload an audio file and get an instant transcript powered by OpenAI Whisper.
        """
    )

    with gr.Row():
        with gr.Column(scale=1):
            api_key_input = gr.Textbox(
                label="OpenAI API Key",
                placeholder="sk-...",
                type="password",
                info="Your key is never stored and only used for this request.",
            )
            audio_input = gr.Audio(
                label="Upload Audio File",
                type="filepath",
                sources=["upload"],
            )
            transcribe_btn = gr.Button("Transcribe", variant="primary")

        with gr.Column(scale=2):
            status_box = gr.Textbox(
                label="Status",
                interactive=False,
                show_label=True,
            )
            transcript_output = gr.Textbox(
                label="Transcript",
                lines=15,
                interactive=True,
                placeholder="Your transcript will appear here...",
            )
            download_btn = gr.Button("Prepare Download", variant="secondary")
            download_file = gr.File(
                label="Download Transcript",
                visible=False,
            )

    # Wire up transcription
    transcribe_btn.click(
        fn=transcribe_audio,
        inputs=[audio_input, api_key_input],
        outputs=[transcript_output, status_box],
    )

    # Wire up download
    def prepare_download(text):
        path = save_transcript(text)
        if path:
            return gr.update(value=path, visible=True)
        return gr.update(visible=False)

    download_btn.click(
        fn=prepare_download,
        inputs=[transcript_output],
        outputs=[download_file],
    )

    gr.Markdown(
        """
        ---
        **Supported formats:** mp3, mp4, mpeg, mpga, m4a, wav, webm
        **Max file size:** 25 MB (OpenAI Whisper limit)
        """
    )


if __name__ == "__main__":
    demo.launch()
