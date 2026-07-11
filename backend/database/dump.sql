# ************************************************************
# Sequel Ace SQL dump
# Versión 20074
#
# https://sequel-ace.com/
# https://github.com/Sequel-Ace/Sequel-Ace
#
# Equipo: 127.0.0.1 (MySQL 8.4.4)
# Base de datos: easynexttime
# Tiempo de generación: 2026-03-26 20:31:22 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE='NO_AUTO_VALUE_ON_ZERO', SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Volcado de tabla api_connection_logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `api_connection_logs`;

CREATE TABLE `api_connection_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `api_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `response_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `status_code` int DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `execution_time_ms` int DEFAULT NULL,
  `executed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `api_connection_logs_tenant_id_api_name_index` (`tenant_id`,`api_name`),
  CONSTRAINT `api_connection_logs_chk_1` CHECK (json_valid(`request_payload`)),
  CONSTRAINT `api_connection_logs_chk_2` CHECK (json_valid(`response_payload`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla api_external_received_ot_data
# ------------------------------------------------------------

DROP TABLE IF EXISTS `api_external_received_ot_data`;

CREATE TABLE `api_external_received_ot_data` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL COMMENT 'Identificador del tenant',
  `system_integration_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del sistema externo de origen: odoo, sap, etc',
  `sync_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de sincronizacion que origino este registro: pull_ot_updates, pull_employees, etc',
  `ot_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de sincronizacion que origino este registro: pull_ot_updates, pull_employees, etc',
  `external_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Identificador unico del registro en el sistema externo',
  `external_created_at` datetime DEFAULT NULL COMMENT 'Fecha de creacion del registro en el sistema externo',
  `external_updated_at` datetime DEFAULT NULL COMMENT 'Fecha de ultima actualizacion del registro en el sistema externo',
  `data` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Payload crudo recibido desde el sistema externo en formato JSON',
  `data_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hash del payload para detectar cambios sin comparar todo el JSON',
  `status` enum('pending','processed','error','ignored') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'Estado de procesamiento interno del registro recibido',
  `attempts` int unsigned NOT NULL DEFAULT '0' COMMENT 'Cantidad de intentos de procesamiento realizados',
  `last_error` text COLLATE utf8mb4_unicode_ci COMMENT 'Detalle del ultimo error de procesamiento',
  `processed_at` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue procesado correctamente',
  `received_at` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue recibido desde el sistema externo',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_ext_received_tenant_system_type_external` (`tenant_id`,`system_integration_name`,`sync_type`,`external_id`),
  UNIQUE KEY `unique_ot_per_tenant` (`tenant_id`,`ot_number`),
  KEY `idx_ext_received_tenant_system_type` (`tenant_id`,`system_integration_name`,`sync_type`),
  KEY `idx_ext_received_tenant_status` (`tenant_id`,`status`),
  KEY `idx_ext_received_tenant_external_updated` (`tenant_id`,`external_updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla api_external_send_documents_ot_data
# ------------------------------------------------------------

DROP TABLE IF EXISTS `api_external_send_documents_ot_data`;

CREATE TABLE `api_external_send_documents_ot_data` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `system_integration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ot_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `documents_generation_snapshot` json DEFAULT NULL,
  `external_project_id` bigint unsigned DEFAULT NULL,
  `external_employee_id` bigint unsigned DEFAULT NULL,
  `external_analytic_account_id` bigint unsigned DEFAULT NULL,
  `external_document_folder_id` bigint unsigned DEFAULT NULL,
  `external_response_submission_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ready_to_send` tinyint(1) NOT NULL DEFAULT '0',
  `sent_execute_datetime` timestamp NULL DEFAULT NULL,
  `sent` tinyint(1) NOT NULL DEFAULT '0',
  `sent_at` timestamp NULL DEFAULT NULL,
  `sync_status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `http_status_code` int unsigned DEFAULT NULL,
  `external_response` json DEFAULT NULL,
  `api_connection_log_id` bigint unsigned DEFAULT NULL,
  `is_force_send` tinyint(1) NOT NULL DEFAULT '0',
  `is_retry` tinyint(1) NOT NULL DEFAULT '0',
  `original_export_id` bigint unsigned DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_docs_tenant` (`tenant_id`),
  KEY `idx_docs_sys_name` (`system_integration_name`),
  KEY `idx_docs_ready` (`ready_to_send`),
  KEY `idx_docs_sent` (`sent`),
  KEY `idx_docs_sync_status` (`sync_status`),
  KEY `idx_documents_ot_send_queue` (`tenant_id`,`ready_to_send`,`sent`,`deleted`,`sent_execute_datetime`),
  KEY `idx_documents_ot_lookup` (`tenant_id`,`system_integration_name`,`ot_number`,`date`,`deleted`),
  KEY `idx_documents_ot_status` (`tenant_id`,`system_integration_name`,`sent`,`sync_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla api_external_send_hours_ot_data
# ------------------------------------------------------------

DROP TABLE IF EXISTS `api_external_send_hours_ot_data`;

CREATE TABLE `api_external_send_hours_ot_data` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `project_id` bigint NOT NULL,
  `system_integration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `daily_workload_detail_id` bigint unsigned NOT NULL,
  `daily_workload_detail_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `user_id` bigint unsigned NOT NULL,
  `ot_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `classification_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `hours` decimal(6,2) NOT NULL,
  `external_project_id` bigint unsigned DEFAULT NULL,
  `external_employee_id` bigint unsigned DEFAULT NULL,
  `external_analytic_account_id` bigint unsigned DEFAULT NULL,
  `external_project_task_id` bigint unsigned DEFAULT NULL,
  `should_send` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Indica si el registro debe ser enviado al sistema externo. Permite marcar como no enviar sin eliminar el registro.',
  `routing_debug` json DEFAULT NULL,
  `task_destination_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_response_submission_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ready_to_send` tinyint(1) NOT NULL DEFAULT '0',
  `sent_execute_datetime` timestamp NULL DEFAULT NULL,
  `sent` tinyint(1) NOT NULL DEFAULT '0',
  `sent_at` timestamp NULL DEFAULT NULL,
  `sync_status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `http_status_code` int unsigned DEFAULT NULL,
  `external_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `api_connection_log_id` bigint unsigned DEFAULT NULL,
  `is_retry` tinyint(1) NOT NULL DEFAULT '0',
  `original_export_id` bigint unsigned DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `api_external_send_hours_ot_data_chk_1` CHECK (json_valid(`daily_workload_detail_snapshot`)),
  CONSTRAINT `api_external_send_hours_ot_data_chk_2` CHECK (json_valid(`external_response`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla api_external_sent_documents_ot_files
# ------------------------------------------------------------

DROP TABLE IF EXISTS `api_external_sent_documents_ot_files`;

CREATE TABLE `api_external_sent_documents_ot_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `api_external_send_documents_ot_data_id` bigint unsigned DEFAULT NULL,
  `tenant_id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `system_integration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ot_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `report_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload` json DEFAULT NULL,
  `sent` tinyint(1) NOT NULL DEFAULT '0',
  `sent_at` timestamp NULL DEFAULT NULL,
  `sync_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `http_status_code` int DEFAULT NULL,
  `external_document_folder_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_document_folder_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_document_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_tag_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_tag_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_response` json DEFAULT NULL,
  `api_connection_log_id` bigint unsigned DEFAULT NULL,
  `is_retry` tinyint(1) NOT NULL DEFAULT '0',
  `original_export_id` bigint unsigned DEFAULT NULL COMMENT 'Si es un reintento, referencia al ID original',
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_parent_ot` (`api_external_send_documents_ot_data_id`),
  KEY `idx_doc_send_queue` (`tenant_id`,`sent`,`deleted`),
  KEY `idx_doc_lookup` (`tenant_id`,`system_integration_name`,`ot_number`),
  KEY `idx_doc_status` (`sync_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla api_integration_sync_controls
# ------------------------------------------------------------

DROP TABLE IF EXISTS `api_integration_sync_controls`;

CREATE TABLE `api_integration_sync_controls` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL COMMENT 'Identificador del tenant',
  `system_integration_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del sistema externo: odoo, sap, etc',
  `sync_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de sincronización: pull_ot_updates, push_hours, etc',
  `last_sync_at` datetime DEFAULT NULL COMMENT 'Última fecha desde la cual se consultan cambios incrementales',
  `last_cursor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Cursor opcional para paginación avanzada o APIs externas',
  `last_success_at` datetime DEFAULT NULL COMMENT 'Última ejecución exitosa',
  `last_error_at` datetime DEFAULT NULL COMMENT 'Última ejecución con error',
  `last_error_message` text COLLATE utf8mb4_unicode_ci COMMENT 'Mensaje del último error ocurrido',
  `status` enum('idle','running','error') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'idle' COMMENT 'Estado actual del proceso de sincronización',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_sync_control_tenant_system_type` (`tenant_id`,`system_integration_name`,`sync_type`),
  KEY `idx_sync_control_tenant` (`tenant_id`),
  KEY `idx_sync_control_tenant_system` (`tenant_id`,`system_integration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla app_data_fail_logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `app_data_fail_logs`;

CREATE TABLE `app_data_fail_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `device` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `url_end_point` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `comment` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `app_data_fail_logs_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `app_data_fail_logs_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `app_data_fail_logs_chk_1` CHECK (json_valid(`payload`)),
  CONSTRAINT `app_data_fail_logs_chk_2` CHECK (json_valid(`device`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla app_received_logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `app_received_logs`;

CREATE TABLE `app_received_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned DEFAULT NULL,
  `user_id_done` bigint unsigned DEFAULT NULL,
  `function_called` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `comment` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `app_received_logs_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `app_received_logs_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `app_received_logs_chk_1` CHECK (json_valid(`payload`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla app_settings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `app_settings`;

CREATE TABLE `app_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `apps_daily_workload_attachment_id` bigint unsigned DEFAULT NULL,
  `apps_daily_workload_client_signature_id` bigint unsigned DEFAULT NULL,
  `apps_daily_workload_who_approval_id` bigint unsigned DEFAULT NULL,
  `apps_cycle_daily_workload_id` bigint unsigned DEFAULT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `app_settings_tenant_id_foreign` (`tenant_id`),
  KEY `app_settings_apps_daily_workload_attachment_id_foreign` (`apps_daily_workload_attachment_id`),
  KEY `app_settings_apps_daily_workload_client_signature_id_foreign` (`apps_daily_workload_client_signature_id`),
  KEY `app_settings_apps_daily_workload_who_approval_id_foreign` (`apps_daily_workload_who_approval_id`),
  KEY `app_settings_apps_cycle_daily_workload_id_foreign` (`apps_cycle_daily_workload_id`),
  CONSTRAINT `app_settings_apps_cycle_daily_workload_id_foreign` FOREIGN KEY (`apps_cycle_daily_workload_id`) REFERENCES `app_settings_cycle_daily_workloads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `app_settings_apps_daily_workload_attachment_id_foreign` FOREIGN KEY (`apps_daily_workload_attachment_id`) REFERENCES `app_settings_daily_workload_attachments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `app_settings_apps_daily_workload_client_signature_id_foreign` FOREIGN KEY (`apps_daily_workload_client_signature_id`) REFERENCES `app_settings_daily_workload_client_signature` (`id`) ON DELETE SET NULL,
  CONSTRAINT `app_settings_apps_daily_workload_who_approval_id_foreign` FOREIGN KEY (`apps_daily_workload_who_approval_id`) REFERENCES `app_settings_daily_workload_who_approval` (`id`) ON DELETE SET NULL,
  CONSTRAINT `app_settings_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla app_settings_cycle_daily_workloads
# ------------------------------------------------------------

DROP TABLE IF EXISTS `app_settings_cycle_daily_workloads`;

CREATE TABLE `app_settings_cycle_daily_workloads` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `days_by_cycle` int NOT NULL DEFAULT '30',
  `day_start_cycle` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monday',
  `required_signature_user_done` tinyint NOT NULL DEFAULT '1',
  `use_pin` tinyint NOT NULL DEFAULT '1',
  `form_cycle_service` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `app_settings_cycle_daily_workloads_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `app_settings_cycle_daily_workloads_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla app_settings_daily_workload_attachments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `app_settings_daily_workload_attachments`;

CREATE TABLE `app_settings_daily_workload_attachments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `photo` tinyint(1) NOT NULL DEFAULT '0',
  `photo_categories` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `document` tinyint(1) NOT NULL DEFAULT '0',
  `document_categories` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `info_button` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `app_settings_daily_workload_attachments_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `app_settings_daily_workload_attachments_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla app_settings_daily_workload_client_signature
# ------------------------------------------------------------

DROP TABLE IF EXISTS `app_settings_daily_workload_client_signature`;

CREATE TABLE `app_settings_daily_workload_client_signature` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `required` tinyint NOT NULL DEFAULT '1',
  `info_button` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `app_settings_daily_workload_client_signature_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `app_settings_daily_workload_client_signature_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla app_settings_daily_workload_fields
# ------------------------------------------------------------

DROP TABLE IF EXISTS `app_settings_daily_workload_fields`;

CREATE TABLE `app_settings_daily_workload_fields` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `app_setting_id` bigint unsigned DEFAULT NULL,
  `unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre único del campo para identificarlo en el código',
  `orden` int NOT NULL DEFAULT '1' COMMENT 'orden de aparicion en el formulario',
  `position_row` int NOT NULL DEFAULT '1' COMMENT 'fila de aparicion en el formulario',
  `position_col` int NOT NULL DEFAULT '1' COMMENT 'columna de aparicion en el formulario',
  `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '"" = no label',
  `starting_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '"" = no value',
  `class` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'input' COMMENT 'textarea, input, select, checkbox, radio, file, iconoptions',
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string' COMMENT 'string, number, date, time, datetime, email, url, phone, password',
  `field_options` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Es un json en caso de ser del tipo select o iconoptions y las opciones sean fijas',
  `limit` int NOT NULL DEFAULT '0' COMMENT '0 = no limit, > 0 = limit',
  `holderplaceholder` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '"" = no placeholder',
  `add_photo` int NOT NULL DEFAULT '0' COMMENT '0 = no add photo, > 0 = cantidad de photo',
  `add_document` int NOT NULL DEFAULT '0' COMMENT '0 = no add document, > 0 = cantidad de document',
  `requeted` tinyint NOT NULL DEFAULT '1' COMMENT '0 = no required, 1 = required',
  `info_button` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '"" = no info button, Es una descripción para el campo de cara al usuario',
  `show_in_form` tinyint NOT NULL DEFAULT '1' COMMENT '0 = no show in form, 1 = show in form',
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `app_settings_daily_workload_fields_unique_name_unique` (`unique_name`),
  KEY `app_settings_daily_workload_fields_tenant_id_foreign` (`tenant_id`),
  KEY `app_settings_daily_workload_fields_app_setting_id_foreign` (`app_setting_id`),
  CONSTRAINT `app_settings_daily_workload_fields_app_setting_id_foreign` FOREIGN KEY (`app_setting_id`) REFERENCES `app_settings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `app_settings_daily_workload_fields_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla app_settings_daily_workload_who_approval
# ------------------------------------------------------------

DROP TABLE IF EXISTS `app_settings_daily_workload_who_approval`;

CREATE TABLE `app_settings_daily_workload_who_approval` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `required` tinyint NOT NULL DEFAULT '1',
  `info_button` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Debe elegir a la persona que aprobara el trabajo',
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `app_settings_daily_workload_who_approval_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `app_settings_daily_workload_who_approval_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla clients
# ------------------------------------------------------------

DROP TABLE IF EXISTS `clients`;

CREATE TABLE `clients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '1: Activo, 0: Inactivo',
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `clients_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `clients_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla daily_workload_change_logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `daily_workload_change_logs`;

CREATE TABLE `daily_workload_change_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `daily_workload_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `field_changed` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `new_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_workload_change_logs_tenant_id_foreign` (`tenant_id`),
  KEY `daily_workload_change_logs_daily_workload_id_foreign` (`daily_workload_id`),
  CONSTRAINT `daily_workload_change_logs_daily_workload_id_foreign` FOREIGN KEY (`daily_workload_id`) REFERENCES `daily_workloads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_change_logs_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla daily_workload_cycle_logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `daily_workload_cycle_logs`;

CREATE TABLE `daily_workload_cycle_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `daily_workload_cycle_id` bigint unsigned NOT NULL,
  `field_changed` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `new_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `user_id_changed` bigint unsigned NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_workload_cycle_logs_daily_workload_cycle_id_foreign` (`daily_workload_cycle_id`),
  KEY `daily_workload_cycle_logs_user_id_changed_foreign` (`user_id_changed`),
  KEY `daily_workload_cycle_logs_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `daily_workload_cycle_logs_daily_workload_cycle_id_foreign` FOREIGN KEY (`daily_workload_cycle_id`) REFERENCES `daily_workload_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_cycle_logs_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_cycle_logs_user_id_changed_foreign` FOREIGN KEY (`user_id_changed`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla daily_workload_cycle_overtimes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `daily_workload_cycle_overtimes`;

CREATE TABLE `daily_workload_cycle_overtimes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `project_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `daily_workload_cycle_id` bigint unsigned NOT NULL,
  `user_id_done_overtime` bigint unsigned NOT NULL,
  `total_overtime_hours` decimal(8,2) NOT NULL DEFAULT '0.00',
  `before_overtime_hours` decimal(8,2) NOT NULL DEFAULT '0.00',
  `after_overtime_hours` decimal(8,2) NOT NULL DEFAULT '0.00',
  `total_time_hours` decimal(8,2) NOT NULL DEFAULT '0.00',
  `regular_work_schedule` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `worked_of_regular_hours` decimal(8,2) NOT NULL DEFAULT '0.00',
  `ot_worked_hours` decimal(8,2) NOT NULL DEFAULT '0.00',
  `overtime_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `user_id_approved` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_workload_cycle_overtimes_daily_workload_cycle_id_foreign` (`daily_workload_cycle_id`),
  KEY `daily_workload_cycle_overtimes_user_id_done_overtime_foreign` (`user_id_done_overtime`),
  KEY `daily_workload_cycle_overtimes_user_id_approved_foreign` (`user_id_approved`),
  KEY `daily_workload_cycle_overtimes_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `daily_workload_cycle_overtimes_daily_workload_cycle_id_foreign` FOREIGN KEY (`daily_workload_cycle_id`) REFERENCES `daily_workload_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_cycle_overtimes_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_cycle_overtimes_user_id_approved_foreign` FOREIGN KEY (`user_id_approved`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `daily_workload_cycle_overtimes_user_id_done_overtime_foreign` FOREIGN KEY (`user_id_done_overtime`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_cycle_overtimes_chk_1` CHECK (json_valid(`project_ids`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla daily_workload_cycles
# ------------------------------------------------------------

DROP TABLE IF EXISTS `daily_workload_cycles`;

CREATE TABLE `daily_workload_cycles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `project_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `id_app` bigint unsigned NOT NULL,
  `ots_associated` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `was_replaced` tinyint(1) NOT NULL DEFAULT '0',
  `replaces_previous_cycle_id` bigint unsigned DEFAULT NULL,
  `replaced_by_next_cycle_id` bigint unsigned DEFAULT NULL,
  `date_requested_in_device` datetime DEFAULT NULL,
  `date_calendar_open` date NOT NULL,
  `date_calendar_closing` date NOT NULL,
  `state` enum('pending','approved','rejected','canceled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_approved` datetime DEFAULT NULL,
  `date_rejected` datetime DEFAULT NULL,
  `date_canceled` datetime DEFAULT NULL,
  `user_id_requests` bigint unsigned DEFAULT NULL,
  `observation_user_requests` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `signature_pin_closing_user_requests` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude_closing` decimal(10,8) DEFAULT NULL,
  `longitude_closing` decimal(11,8) DEFAULT NULL,
  `accuracy_closing` decimal(8,2) DEFAULT NULL,
  `raw_position_closing` json DEFAULT NULL,
  `user_id_approved` bigint unsigned DEFAULT NULL,
  `observation_user_approver` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reviewed` tinyint(1) NOT NULL DEFAULT '0',
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `signature_pin_user_approved` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_workload_cycles_user_id_requests_foreign` (`user_id_requests`),
  KEY `daily_workload_cycles_tenant_id_foreign` (`tenant_id`),
  KEY `daily_workload_cycles_reviewed_by_foreign` (`reviewed_by`),
  KEY `idx_cycle_closing_position` (`latitude_closing`,`longitude_closing`),
  CONSTRAINT `daily_workload_cycles_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `daily_workload_cycles_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_cycles_user_id_requests_foreign` FOREIGN KEY (`user_id_requests`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `daily_workload_cycles_chk_1` CHECK (json_valid(`project_ids`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla daily_workload_detail_change_logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `daily_workload_detail_change_logs`;

CREATE TABLE `daily_workload_detail_change_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `daily_workload_detail_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `field_unique_name_changed` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `new_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_workload_detail_change_logs_tenant_id_foreign` (`tenant_id`),
  KEY `dw_detail_change_log_foreign` (`daily_workload_detail_id`),
  CONSTRAINT `daily_workload_detail_change_logs_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dw_detail_change_log_foreign` FOREIGN KEY (`daily_workload_detail_id`) REFERENCES `daily_workload_details` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla daily_workload_detail_old_records
# ------------------------------------------------------------

DROP TABLE IF EXISTS `daily_workload_detail_old_records`;

CREATE TABLE `daily_workload_detail_old_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned DEFAULT NULL,
  `daily_workload_id` bigint unsigned NOT NULL,
  `id_app` bigint unsigned NOT NULL,
  `number_voucher_service` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_1_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_1_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_1_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_1_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_2_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_2_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_2_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_2_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_3_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_3_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_3_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_3_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_4_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_4_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_4_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_4_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_5_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_5_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_5_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_5_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_6_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_6_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_6_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_6_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_7_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_7_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_7_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_7_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_8_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_8_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_8_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_8_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_9_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_9_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_9_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_9_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_10_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_10_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_10_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_10_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_workload_detail_old_records_tenant_id_foreign` (`tenant_id`),
  KEY `daily_workload_detail_old_records_daily_workload_id_foreign` (`daily_workload_id`),
  CONSTRAINT `daily_workload_detail_old_records_daily_workload_id_foreign` FOREIGN KEY (`daily_workload_id`) REFERENCES `daily_workload_old_records` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_detail_old_records_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_detail_old_records_chk_1` CHECK (json_valid(`field_1_detail`)),
  CONSTRAINT `daily_workload_detail_old_records_chk_10` CHECK (json_valid(`field_10_detail`)),
  CONSTRAINT `daily_workload_detail_old_records_chk_2` CHECK (json_valid(`field_2_detail`)),
  CONSTRAINT `daily_workload_detail_old_records_chk_3` CHECK (json_valid(`field_3_detail`)),
  CONSTRAINT `daily_workload_detail_old_records_chk_4` CHECK (json_valid(`field_4_detail`)),
  CONSTRAINT `daily_workload_detail_old_records_chk_5` CHECK (json_valid(`field_5_detail`)),
  CONSTRAINT `daily_workload_detail_old_records_chk_6` CHECK (json_valid(`field_6_detail`)),
  CONSTRAINT `daily_workload_detail_old_records_chk_7` CHECK (json_valid(`field_7_detail`)),
  CONSTRAINT `daily_workload_detail_old_records_chk_8` CHECK (json_valid(`field_8_detail`)),
  CONSTRAINT `daily_workload_detail_old_records_chk_9` CHECK (json_valid(`field_9_detail`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla daily_workload_details
# ------------------------------------------------------------

DROP TABLE IF EXISTS `daily_workload_details`;

CREATE TABLE `daily_workload_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned DEFAULT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `daily_workload_id` bigint unsigned NOT NULL,
  `id_app` bigint unsigned NOT NULL,
  `number_voucher_service` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failure_type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_1_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_1_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_1_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_1_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_2_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_2_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_2_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_2_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_3_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_3_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_3_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_3_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_4_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_4_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_4_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_4_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_5_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_5_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_5_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_5_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_6_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_6_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_6_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_6_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_7_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_7_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_7_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_7_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_8_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_8_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_8_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_8_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_9_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_9_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_9_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_9_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `field_10_unique_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_10_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `field_10_real_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `field_10_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_workload_details_tenant_id_foreign` (`tenant_id`),
  KEY `daily_workload_details_daily_workload_id_foreign` (`daily_workload_id`),
  KEY `daily_workload_details_project_id_index` (`project_id`),
  CONSTRAINT `daily_workload_details_daily_workload_id_foreign` FOREIGN KEY (`daily_workload_id`) REFERENCES `daily_workloads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_details_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_details_chk_1` CHECK (json_valid(`field_1_detail`)),
  CONSTRAINT `daily_workload_details_chk_10` CHECK (json_valid(`field_10_detail`)),
  CONSTRAINT `daily_workload_details_chk_2` CHECK (json_valid(`field_2_detail`)),
  CONSTRAINT `daily_workload_details_chk_3` CHECK (json_valid(`field_3_detail`)),
  CONSTRAINT `daily_workload_details_chk_4` CHECK (json_valid(`field_4_detail`)),
  CONSTRAINT `daily_workload_details_chk_5` CHECK (json_valid(`field_5_detail`)),
  CONSTRAINT `daily_workload_details_chk_6` CHECK (json_valid(`field_6_detail`)),
  CONSTRAINT `daily_workload_details_chk_7` CHECK (json_valid(`field_7_detail`)),
  CONSTRAINT `daily_workload_details_chk_8` CHECK (json_valid(`field_8_detail`)),
  CONSTRAINT `daily_workload_details_chk_9` CHECK (json_valid(`field_9_detail`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla daily_workload_old_records
# ------------------------------------------------------------

DROP TABLE IF EXISTS `daily_workload_old_records`;

CREATE TABLE `daily_workload_old_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `id_app` bigint unsigned NOT NULL,
  `user_id_done` bigint unsigned NOT NULL,
  `date_calendar` date NOT NULL,
  `users_id_who_can_approve` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled_to_edit` tinyint(1) NOT NULL DEFAULT '1',
  `closed_and_approved` tinyint(1) NOT NULL DEFAULT '0',
  `signature` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `attach` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_workload_old_records_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `daily_workload_old_records_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workload_old_records_chk_1` CHECK (json_valid(`signature`)),
  CONSTRAINT `daily_workload_old_records_chk_2` CHECK (json_valid(`attach`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla daily_workload_positions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `daily_workload_positions`;

CREATE TABLE `daily_workload_positions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `daily_workload_id` bigint unsigned NOT NULL,
  `type` enum('start','end','checkpoint') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `accuracy` decimal(8,2) DEFAULT NULL,
  `altitude` decimal(8,2) DEFAULT NULL,
  `speed` decimal(8,2) DEFAULT NULL,
  `bearing` decimal(8,2) DEFAULT NULL,
  `is_mock` tinyint(1) NOT NULL DEFAULT '0',
  `provider` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_time` bigint DEFAULT NULL,
  `raw_position` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_workload_positions_tenant_id_daily_workload_id_index` (`tenant_id`,`daily_workload_id`),
  KEY `daily_workload_positions_daily_workload_id_type_index` (`daily_workload_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla daily_workloads
# ------------------------------------------------------------

DROP TABLE IF EXISTS `daily_workloads`;

CREATE TABLE `daily_workloads` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `project_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `id_app` bigint unsigned NOT NULL,
  `user_id_done` bigint unsigned NOT NULL,
  `app_received_log_id` bigint unsigned DEFAULT NULL,
  `date_calendar` date NOT NULL,
  `users_id_who_can_approve` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled_to_edit` tinyint(1) NOT NULL DEFAULT '1',
  `closed_and_approved` tinyint(1) NOT NULL DEFAULT '0',
  `signature` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `service_details_cycle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `attach` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `service_checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ots_sent_to_repository` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_workloads_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `daily_workloads_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_workloads_chk_1` CHECK (json_valid(`project_ids`)),
  CONSTRAINT `daily_workloads_chk_2` CHECK (json_valid(`signature`)),
  CONSTRAINT `daily_workloads_chk_3` CHECK (json_valid(`attach`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla data_work_orders
# ------------------------------------------------------------

DROP TABLE IF EXISTS `data_work_orders`;

CREATE TABLE `data_work_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `date_calendar` date NOT NULL,
  `ot_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sub_ot_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Campo opcional para identificar sub OTs (ej: por motor, equipo, etc.)',
  `sub_ot_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valor específico que distingue la sub OT (ej: nombre o serial del motor)',
  `user_id` bigint unsigned DEFAULT NULL COMMENT 'Usuario que creó el registro (o NULL si fue automático)',
  `ot_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'Campos personalizados del servicio en formato JSON',
  `ot_details_last_version` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'Campos actualizados del servicio en formato JSON, para mantener un historial de cambios',
  `ot_details_original` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'Campos originales del servicio en formato JSON, sin modificaciones',
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_tenant_ot_date_sub_ot_value` (`tenant_id`,`ot_number`,`date_calendar`,`sub_ot_value`),
  KEY `idx_tenant_ot_date` (`tenant_id`,`ot_number`,`date_calendar`),
  KEY `idx_tenant_date` (`tenant_id`,`date_calendar`),
  KEY `data_work_orders_project_id_index` (`project_id`),
  CONSTRAINT `data_work_orders_chk_1` CHECK (json_valid(`ot_details`)),
  CONSTRAINT `data_work_orders_chk_2` CHECK (json_valid(`ot_details_last_version`)),
  CONSTRAINT `data_work_orders_chk_3` CHECK (json_valid(`ot_details_original`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla departments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `departments`;

CREATE TABLE `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `departments_tenant_id_index` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla equipment_checklist_template_items
# ------------------------------------------------------------

DROP TABLE IF EXISTS `equipment_checklist_template_items`;

CREATE TABLE `equipment_checklist_template_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `equipment_checklist_template_id` bigint unsigned NOT NULL,
  `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `input_type` enum('text','textarea','number','select','checkbox','text_nro','select_photo','swich','select_brm','select_multi') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `placeholder` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `equipment_checklist_template_items_chk_1` CHECK (json_valid(`options`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla equipment_checklist_templates
# ------------------------------------------------------------

DROP TABLE IF EXISTS `equipment_checklist_templates`;

CREATE TABLE `equipment_checklist_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `equipment_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mantención',
  `periodicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'regular',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla equipments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `equipments`;

CREATE TABLE `equipments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla failed_jobs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `failed_jobs`;

CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla licenses
# ------------------------------------------------------------

DROP TABLE IF EXISTS `licenses`;

CREATE TABLE `licenses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `license_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `license_type` enum('user','standard','professional','premium','business') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'business',
  `status` enum('active','suspended','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `activated_at` timestamp NULL DEFAULT NULL,
  `disabled_at` timestamp NULL DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `deleted` int NOT NULL DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `licenses_license_key_unique` (`license_key`),
  KEY `licenses_tenant_id_index` (`tenant_id`),
  KEY `licenses_license_type_index` (`license_type`),
  KEY `licenses_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla log_app_data
# ------------------------------------------------------------

DROP TABLE IF EXISTS `log_app_data`;

CREATE TABLE `log_app_data` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code_fail` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'codigo unico de fallo',
  `service_called` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'modelo para indexar',
  `request_id` int unsigned DEFAULT NULL COMMENT 'id de la solicitud para indexar',
  `data_try_saved` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'objeto fallido que se debio guardar',
  `data_size` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'el tamaño del paquete fallido Kbytes',
  `time_at_phone` datetime DEFAULT NULL COMMENT 'fecha hora del dispositivo en ese momento',
  `sistem_operative_phone_version` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'version del sistema del dispositivo',
  `app_version` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'version de la app',
  `app_memory_storage` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'espacio de memoria en el telefono ',
  `app_red_used` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'estado de la red wifi o datos',
  `app_phone_ip_send_data` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ip de donde viene el servicio',
  `user_id` int unsigned DEFAULT NULL COMMENT 'usuario id',
  `user_all_info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'usuario resto de datos todo el objeto',
  `code_error_get_service` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'codigo de error en la app',
  `observacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'observacion',
  `active` enum('activo','inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla log_data_movements
# ------------------------------------------------------------

DROP TABLE IF EXISTS `log_data_movements`;

CREATE TABLE `log_data_movements` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `user_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `model_id` int DEFAULT NULL,
  `event` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'TIPO DE DATOS: OR - OR NEUMÁTICOS | RN - RN NEUMÁTICOS | OE - OE NEÚMATICOS | BODEGA',
  `old_values` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `new_values` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deleted` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `log_data_movements_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `log_data_movements_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla migrations
# ------------------------------------------------------------

DROP TABLE IF EXISTS `migrations`;

CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla oauth_access_tokens
# ------------------------------------------------------------

DROP TABLE IF EXISTS `oauth_access_tokens`;

CREATE TABLE `oauth_access_tokens` (
  `id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `client_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scopes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_access_tokens_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla oauth_auth_codes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `oauth_auth_codes`;

CREATE TABLE `oauth_auth_codes` (
  `id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `client_id` bigint unsigned NOT NULL,
  `scopes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_auth_codes_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla oauth_clients
# ------------------------------------------------------------

DROP TABLE IF EXISTS `oauth_clients`;

CREATE TABLE `oauth_clients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `redirect` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `personal_access_client` tinyint(1) NOT NULL,
  `password_client` tinyint(1) NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_clients_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla oauth_personal_access_clients
# ------------------------------------------------------------

DROP TABLE IF EXISTS `oauth_personal_access_clients`;

CREATE TABLE `oauth_personal_access_clients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla oauth_refresh_tokens
# ------------------------------------------------------------

DROP TABLE IF EXISTS `oauth_refresh_tokens`;

CREATE TABLE `oauth_refresh_tokens` (
  `id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_token_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_refresh_tokens_access_token_id_index` (`access_token_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla password_resets
# ------------------------------------------------------------

DROP TABLE IF EXISTS `password_resets`;

CREATE TABLE `password_resets` (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` bigint unsigned NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  KEY `password_resets_tenant_id_foreign` (`tenant_id`),
  KEY `password_resets_email_index` (`email`),
  CONSTRAINT `password_resets_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla project_user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `project_user`;

CREATE TABLE `project_user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_user_tenant_id_project_id_user_id_unique` (`tenant_id`,`project_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla projects
# ------------------------------------------------------------

DROP TABLE IF EXISTS `projects`;

CREATE TABLE `projects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `zone_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `projects_tenant_id_index` (`tenant_id`),
  KEY `projects_zone_id_foreign` (`zone_id`),
  CONSTRAINT `projects_zone_id_foreign` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla requesteds
# ------------------------------------------------------------

DROP TABLE IF EXISTS `requesteds`;

CREATE TABLE `requesteds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `solicitud_id` int DEFAULT NULL,
  `user_solicitante_id` int DEFAULT NULL,
  `tipo_solicitud` enum('or_retirada','oe_entregada','rn_terminada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_solicitud` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_result` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `model_id_result` int DEFAULT NULL,
  `fecha_ejecucion_result` datetime DEFAULT NULL,
  `fecha_solicitud` datetime DEFAULT NULL,
  `ejecutada` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla roles
# ------------------------------------------------------------

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `roles_can_approve` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'los niveles se armar asi: "role_id"*"role_id"*...*"role_id"',
  `enabled_app` tinyint NOT NULL DEFAULT '0',
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`),
  KEY `roles_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `roles_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla tenant_system_variables
# ------------------------------------------------------------

DROP TABLE IF EXISTS `tenant_system_variables`;

CREATE TABLE `tenant_system_variables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique key for the system variable, e.g., "maintenance_mode"',
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'Value of the system variable, stored as JSON for flexibility',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Opcional, description of the system variable',
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_system_variables_tenant_id_key_unique` (`tenant_id`,`key`),
  CONSTRAINT `tenant_system_variables_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tenant_system_variables_chk_1` CHECK (json_valid(`value`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla tenants
# ------------------------------------------------------------

DROP TABLE IF EXISTS `tenants`;

CREATE TABLE `tenants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `domain` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '1: Activo, 0: Inactivo',
  `date_register` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenants_domain_unique` (`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla user_checkins
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_checkins`;

CREATE TABLE `user_checkins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `operation_type` enum('check-in','check-out') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_datetime` timestamp NULL DEFAULT NULL,
  `server_datetime` timestamp NOT NULL,
  `raw_position` json DEFAULT NULL,
  `checkin_reference_id` bigint unsigned DEFAULT NULL,
  `device_info` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auto_closed` tinyint(1) NOT NULL DEFAULT '0',
  `auto_generated` tinyint NOT NULL DEFAULT '0' COMMENT '1 = generado automáticamente por el sistema',
  `deleted` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_checkins_tenant_id_user_id_index` (`tenant_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla user_frequent_descriptions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_frequent_descriptions`;

CREATE TABLE `user_frequent_descriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_frequent_descriptions_tenant_id_foreign` (`tenant_id`),
  KEY `user_frequent_descriptions_user_id_foreign` (`user_id`),
  CONSTRAINT `user_frequent_descriptions_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_frequent_descriptions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla user_licenses
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_licenses`;

CREATE TABLE `user_licenses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `license_id` bigint unsigned NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `assigned_at` timestamp NULL DEFAULT NULL,
  `unassigned_at` timestamp NULL DEFAULT NULL,
  `deleted` int NOT NULL DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_licenses_tenant_id_index` (`tenant_id`),
  KEY `user_licenses_user_id_index` (`user_id`),
  KEY `user_licenses_license_id_index` (`license_id`),
  KEY `user_licenses_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla user_notifications
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_notifications`;

CREATE TABLE `user_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned DEFAULT NULL,
  `user_id_from` bigint unsigned DEFAULT NULL,
  `user_id_to` bigint unsigned DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `read` tinyint(1) NOT NULL DEFAULT '0',
  `label` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'important',
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `type` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'app',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_notifications_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `user_notifications_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla user_pin_pass_signatures
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_pin_pass_signatures`;

CREATE TABLE `user_pin_pass_signatures` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `pin_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enable` tinyint NOT NULL DEFAULT '1',
  `deleted` tinyint NOT NULL DEFAULT '0',
  `failed_attempts` int NOT NULL DEFAULT '0',
  `expires_at` timestamp NULL DEFAULT NULL,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_pin_pass_signatures_user_id_foreign` (`user_id`),
  KEY `user_pin_pass_signatures_tenant_id_user_id_index` (`tenant_id`,`user_id`),
  CONSTRAINT `user_pin_pass_signatures_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_pin_pass_signatures_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla user_settings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_settings`;

CREATE TABLE `user_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `notification` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `working_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `security` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `app_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `app_permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `web_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `web_permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_settings_tenant_id_foreign` (`tenant_id`),
  KEY `user_settings_user_id_foreign` (`user_id`),
  CONSTRAINT `user_settings_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_settings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_settings_chk_1` CHECK (json_valid(`notification`)),
  CONSTRAINT `user_settings_chk_2` CHECK (json_valid(`working_hours`)),
  CONSTRAINT `user_settings_chk_3` CHECK (json_valid(`security`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned DEFAULT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `is_billable` tinyint(1) NOT NULL DEFAULT '1',
  `global_uniqueId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_superadmin` tinyint(1) NOT NULL DEFAULT '0',
  `username` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'debe ser unico en todo el sistema ejemplo alex25814237',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `second_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `second_last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `joining_date` datetime DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('masculino','femenino','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'otro',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` bigint unsigned DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '1: Activo, 0: Inactivo, 2: Licencia, 3: Vacaciones',
  `img_profile` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_push_mobile` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `device` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_detail` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `version_app` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `version_app_playstore` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.2' COMMENT '#update users set version_app_playstore = ''1.2'' where 1;',
  `token_push_web` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `detail_web` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `updated_by` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `last_login` datetime DEFAULT NULL,
  `last_logout` datetime DEFAULT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  KEY `users_tenant_id_foreign` (`tenant_id`),
  KEY `users_role_id_foreign` (`role_id`),
  KEY `users_tenant_id_department_id_index` (`tenant_id`,`department_id`),
  CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `users_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla websockets_statistics_entries
# ------------------------------------------------------------

DROP TABLE IF EXISTS `websockets_statistics_entries`;

CREATE TABLE `websockets_statistics_entries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `app_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `peak_connection_count` int NOT NULL,
  `websocket_message_count` int NOT NULL,
  `api_message_count` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla wizard_ot_changes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `wizard_ot_changes`;

CREATE TABLE `wizard_ot_changes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `wizard_key` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` bigint unsigned NOT NULL,
  `user_id_done` bigint unsigned NOT NULL,
  `action_request` enum('exchange','transfer_new','transfer_exist') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ot_number_source` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_calendar_source` date DEFAULT NULL,
  `daily_workload_id_source` bigint unsigned DEFAULT NULL,
  `data_source` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ot_number_destination` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_calendar_destination` date DEFAULT NULL,
  `daily_workload_id_destination` bigint unsigned DEFAULT NULL,
  `data_destination` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `details_change` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `undo_data_source` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `undo_data_destination` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `confirmed` tinyint(1) NOT NULL DEFAULT '0',
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wizard_ot_changes_wizard_key_unique` (`wizard_key`),
  KEY `wizard_ot_changes_tenant_id_deleted_index` (`tenant_id`,`deleted`),
  KEY `wizard_ot_changes_user_id_done_confirmed_index` (`user_id_done`,`confirmed`),
  CONSTRAINT `wizard_ot_changes_chk_1` CHECK (json_valid(`data_source`)),
  CONSTRAINT `wizard_ot_changes_chk_2` CHECK (json_valid(`data_destination`)),
  CONSTRAINT `wizard_ot_changes_chk_3` CHECK (json_valid(`details_change`)),
  CONSTRAINT `wizard_ot_changes_chk_4` CHECK (json_valid(`undo_data_source`)),
  CONSTRAINT `wizard_ot_changes_chk_5` CHECK (json_valid(`undo_data_destination`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla work_order_repositories
# ------------------------------------------------------------

DROP TABLE IF EXISTS `work_order_repositories`;

CREATE TABLE `work_order_repositories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `ot_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_calendar` date NOT NULL,
  `user_id_done_ot` bigint unsigned NOT NULL,
  `user_id_approve_ot` bigint unsigned DEFAULT NULL,
  `user_id_manager_ot` bigint unsigned DEFAULT NULL,
  `equipment_id` bigint unsigned DEFAULT NULL,
  `equipment_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `equipment_brand` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `equipment_model` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `equipment_serie_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name_1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name_2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name_3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name_4` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_ids_done_ot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ot_signature` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ot_service_details_cycle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ot_attach` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ot_service_checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `report_snapshot_ot_hours_of_service` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `report_snapshot_ot_technical_service` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `was_replaced` tinyint(1) NOT NULL DEFAULT '0',
  `replaces_previous_cycle_id` bigint unsigned DEFAULT NULL,
  `replaced_by_next_cycle_id` bigint unsigned DEFAULT NULL,
  `synced_to_sharepoint` tinyint NOT NULL DEFAULT '1' COMMENT '1: Pendiente por sincronizar, 2: Sincronización en proceso, 3: Sincronizado a SharePoint, 4: Sincronización fallida',
  `sharepoint_sync_date` timestamp NULL DEFAULT NULL,
  `user_id_synced` bigint unsigned DEFAULT NULL,
  `sharepoint_sync_file_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL del archivo sincronizado en SharePoint',
  `sharepoint_sync_result` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mensaje de error en caso de fallo de sincronización',
  `sharepoint_sync_response_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ID del archivo en SharePoint',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `work_order_repositories_user_id_done_ot_foreign` (`user_id_done_ot`),
  KEY `work_order_repositories_user_id_synced_foreign` (`user_id_synced`),
  KEY `work_order_repositories_equipment_id_foreign` (`equipment_id`),
  KEY `work_order_repositories_replaces_previous_cycle_id_foreign` (`replaces_previous_cycle_id`),
  KEY `work_order_repositories_replaced_by_next_cycle_id_foreign` (`replaced_by_next_cycle_id`),
  KEY `wrepo_tenant_ot_del_idx` (`tenant_id`,`ot_number`,`deleted`),
  KEY `wrepo_tenant_date_del_idx` (`tenant_id`,`date_calendar`,`deleted`),
  KEY `wrepo_tenant_user_del_idx` (`tenant_id`,`user_id_done_ot`,`deleted`),
  KEY `wrepo_tenant_equip_del_idx` (`tenant_id`,`equipment_id`,`deleted`),
  KEY `wrepo_tenant_repl_del_idx` (`tenant_id`,`was_replaced`,`deleted`),
  KEY `wrepo_tenant_sync_del_idx` (`tenant_id`,`synced_to_sharepoint`,`deleted`),
  KEY `work_order_repositories_project_id_index` (`project_id`),
  CONSTRAINT `work_order_repositories_equipment_id_foreign` FOREIGN KEY (`equipment_id`) REFERENCES `equipments` (`id`),
  CONSTRAINT `work_order_repositories_replaced_by_next_cycle_id_foreign` FOREIGN KEY (`replaced_by_next_cycle_id`) REFERENCES `work_order_repositories` (`id`),
  CONSTRAINT `work_order_repositories_replaces_previous_cycle_id_foreign` FOREIGN KEY (`replaces_previous_cycle_id`) REFERENCES `work_order_repositories` (`id`),
  CONSTRAINT `work_order_repositories_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `work_order_repositories_user_id_done_ot_foreign` FOREIGN KEY (`user_id_done_ot`) REFERENCES `users` (`id`),
  CONSTRAINT `work_order_repositories_user_id_synced_foreign` FOREIGN KEY (`user_id_synced`) REFERENCES `users` (`id`),
  CONSTRAINT `work_order_repositories_chk_1` CHECK (json_valid(`user_ids_done_ot`)),
  CONSTRAINT `work_order_repositories_chk_2` CHECK (json_valid(`ot_signature`)),
  CONSTRAINT `work_order_repositories_chk_3` CHECK (json_valid(`ot_service_details_cycle`)),
  CONSTRAINT `work_order_repositories_chk_4` CHECK (json_valid(`ot_attach`)),
  CONSTRAINT `work_order_repositories_chk_5` CHECK (json_valid(`ot_service_checklist`)),
  CONSTRAINT `work_order_repositories_chk_6` CHECK (json_valid(`report_snapshot_ot_hours_of_service`)),
  CONSTRAINT `work_order_repositories_chk_7` CHECK (json_valid(`report_snapshot_ot_technical_service`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla workday_reminder_logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `workday_reminder_logs`;

CREATE TABLE `workday_reminder_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `block_number` int NOT NULL,
  `date` date NOT NULL,
  `sent_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_workday_reminder_block` (`tenant_id`,`user_id`,`type`,`block_number`,`date`),
  KEY `workday_reminder_logs_tenant_id_user_id_index` (`tenant_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Volcado de tabla zones
# ------------------------------------------------------------

DROP TABLE IF EXISTS `zones`;

CREATE TABLE `zones` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `zones_tenant_id_index` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
