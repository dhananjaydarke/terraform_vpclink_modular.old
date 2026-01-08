terraform {
  required_version = ">= 1.7.0, < 2.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.1"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

}
