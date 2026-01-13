# CiGenie 🤖  
### AI-Assisted CI/CD Decision Platform

CiGenie is an AI-assisted CI/CD automation platform built on top of Jenkins.  
It enhances traditional CI pipelines by integrating a Large Language Model (LLM) to assist in **test evaluation, decision making, and pipeline orchestration**, without replacing existing CI tools.

CiGenie acts as an intelligent layer that observes build and test results and helps decide whether a build should pass, fail, or require developer attention.

---

## 🚀 Project Overview

Modern CI/CD pipelines rely heavily on predefined rules. While tools like Jenkins automate builds and testing, decision making is still rigid and manual.

CiGenie introduces an AI-assisted decision layer into the CI/CD workflow by:
- Observing test execution results
- Analyzing logs and failure patterns
- Assisting Jenkins in making intelligent pipeline decisions

This project demonstrates how AI can be safely integrated into existing CI/CD systems to improve efficiency and early defect detection.

---

## 🧠 Key Features

- ✅ Jenkins-based CI pipeline automation
- 🤖 LLM-assisted decision making
- 🧪 Automated test execution using PyTest
- 📊 Intelligent build pass/fail evaluation
- 🔌 Non-intrusive integration (does not replace Jenkins)
- 🌐 Scalable design for multi-project usage

---

## 🏗️ System Architecture

```text
Developer
   |
   | Push Code
   v
GitHub Repository
   |
   | Webhook Trigger
   v
Jenkins Pipeline
   |
   | Test & Build Data
   v
Backend API (CiGenie)
   |
   | Prompt + Logs
   v
LLM (Cloud API)
   |
   | Decision Output
   v
Jenkins (Pass / Fail / Notify)
