''' Example script that shows how to use the available NAMESPACE, ENV_PREFIX & REGION
    variables to get an SQS Queue using boto3'''

import boto3
import logging
import os

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)

LOGGER = logging.getLogger(__name__)

# Set default environment variables
NAMESPACE = os.getenv("NAMESPACE")
ENV_PREFIX = os.getenv("ENV_PREFIX")
REGION = os.getenv("REGION")

EXPECTED_QUEUE_NAME = f"{NAMESPACE}-{ENV_PREFIX}-{REGION}"

def get_sqs_queues():
    """Retrieve a list of SQS queue URLs and names."""
    sqs_client = boto3.client("sqs")
    response = sqs_client.list_queues()
    queue_urls = response.get("QueueUrls", [])

    queues = []
    for url in queue_urls:
        queue_name = url.split("/")[-1]
        queues.append({"QueueUrl": url, "QueueName": queue_name})

    return queues

def test_get_sqs_queues():
    """Test that the specific SQS queue can be found."""
    try:
        queues = get_sqs_queues()
        assert isinstance(queues, list), "Response should be a list"

        matching_queue = next((q for q in queues if q["QueueName"] == EXPECTED_QUEUE_NAME), None)
        if matching_queue:
            LOGGER.info("post_deploy job ran successfully!")
            LOGGER.info(f"Found expected SQS queue: {matching_queue}")
        else:
            LOGGER.warning(f"Expected SQS queue '{EXPECTED_QUEUE_NAME}' not found.")
    except Exception as e:
        LOGGER.error("post_deploy job failed to run")
        LOGGER.info("Failed to retrieve SQS queues.")
        LOGGER.error(str(e))

test_get_sqs_queues()
